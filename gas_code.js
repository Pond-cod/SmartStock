const SPREADSHEET_ID = '1bgcsaDbQEPJKKxX3pCg_XD8eK5GmKznEfxilQ327D0g';
const EXPECTED_TOKEN = 'INVENTORY_SECURE_TOKEN_2026';

function doGet(e) {
  if (e.parameter.token !== EXPECTED_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({error: "Unauthorized GET"})).setMimeType(ContentService.MimeType.JSON);
  }

  const sheetName = e.parameter.sheet;
  if (!sheetName) return ContentService.createTextOutput(JSON.stringify({error: "No sheet specified"})).setMimeType(ContentService.MimeType.JSON);
  
  const cache = CacheService.getScriptCache();
  if (sheetName === 'ALL') {
    const cached = cache.get("all_data_json");
    if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  if (sheetName === 'ALL') {
    const getSheetData = (sName) => {
      const sheet = ss.getSheetByName(sName);
      if (!sheet) return [];
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return [];
      const headers = data[0];
      return data.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => obj[h] = row[i]);
        return obj;
      });
    };
    
    const result = {
      Categories: getSheetData('Categories'),
      Equipments: getSheetData('Equipments'),
      Users: getSheetData('Users'),
      Settings: getSheetData('Settings'),
      Personnel: getSheetData('Personnel'),
      Departments: getSheetData('Departments'),
      Transactions: getSheetData('Transactions')
    };
    
    const resultJson = JSON.stringify(result);
    cache.put("all_data_json", resultJson, 300); // Cache for 5 minutes
    return ContentService.createTextOutput(resultJson).setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({error: "Sheet not found"})).setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
  
  const headers = data[0];
  const rows = data.slice(1);
  const result = rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let params;
  if (e.postData && e.postData.contents) {
    try {
      params = JSON.parse(e.postData.contents);
    } catch (err) {
      params = e.parameter;
    }
  } else {
    params = e.parameter;
  }
  
  const action = params.action;
  const sheetName = params.sheet;
  const data = params.data;
  const token = params.token;
  const caller = params.caller || "system";
  
  if (token !== EXPECTED_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Unauthorized POST"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (!action || !data) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Missing parameters"})).setMimeType(ContentService.MimeType.JSON);
  }

  let lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Wait up to 15 seconds for lock
    const cache = CacheService.getScriptCache();
    
    if (action === 'UPLOAD_IMAGE') {
      let folders = DriveApp.getFoldersByName('Inventory_Images');
      let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Inventory_Images');
      
      const base64Data = data.base64.split(',')[1] || data.base64;
      const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), data.mimeType || 'image/png', data.fileName || ('IMG_' + Date.now() + '.png'));
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      const fileId = file.getId();
      const directUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
      
      return ContentService.createTextOutput(JSON.stringify({success: true, url: directUrl, fileId: fileId})).setMimeType(ContentService.MimeType.JSON);
    }

    if (!sheetName) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({success: false, error: "Missing sheet name"})).setMimeType(ContentService.MimeType.JSON);
    }
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: "Sheet not found"})).setMimeType(ContentService.MimeType.JSON);

  const writeAuditLog = () => {
    if (sheetName === 'Transactions') return; // Don't log logs
    try {
      const txSheet = ss.getSheetByName('Transactions');
      if (!txSheet) return;
      const txHeaders = txSheet.getDataRange().getValues()[0];
      const logData = {
        TransactionID: `TXN-${Date.now()}`,
        Date: new Date().toISOString(),
        User: caller,
        Action: `${action} on ${sheetName}`,
        Details: JSON.stringify(data).substring(0, 200)
      };
      const logRow = txHeaders.map(h => logData[h] || "");
      txSheet.appendRow(logRow);
    } catch(e) { console.error("Audit log failed", e); }
  };

  if (action === 'ADD') {
    const headers = sheet.getDataRange().getValues()[0];
    const newRow = headers.map(h => {
      if (h === 'CreatedAt' && !data[h]) {
        return new Date().toISOString();
      }
      return data[h] !== undefined ? data[h] : "";
    });
    sheet.appendRow(newRow);
    cache.remove("all_data_json");
    writeAuditLog();
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Added successfully"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  const findRowIndex = (sh, field, id) => {
    const shHeaders = sh.getDataRange().getValues()[0];
    const shRows = sh.getDataRange().getValues();
    const colIdx = shHeaders.indexOf(field);
    if (colIdx === -1) return -1;
    for (let i = 1; i < shRows.length; i++) {
      if (shRows[i][colIdx] == id) return i + 1;
    }
    return -1;
  };

  const getIdField = (sName) => {
    if (sName === 'Categories') return 'CategoryID';
    if (sName === 'Equipments') return 'EquipmentCode';
    if (sName === 'Users') return 'Username';
    if (sName === 'Settings') return 'ID';
    if (sName === 'Personnel') return 'PersonnelID';
    if (sName === 'Departments') return 'DepartmentID';
    if (sName === 'Transactions') return 'TransactionID';
    return null;
  };

  if (action === 'EDIT') {
    const headers = sheet.getDataRange().getValues()[0];
    const rows = sheet.getDataRange().getValues();
    const idField = getIdField(sheetName);
    const rowId = data[idField];
    
    let rowIndex = -1;
    for(let i=1; i<rows.length; i++) {
       if (rows[i][headers.indexOf(idField)] == rowId) {
         rowIndex = i + 1;
         break;
       }
    }
    
    if (rowIndex > -1) {
       const currentRowValues = rows[rowIndex - 1];
       headers.forEach((h, i) => {
          if (data[h] !== undefined && h !== 'CreatedAt') {
             currentRowValues[i] = data[h];
          }
       });
       sheet.getRange(rowIndex, 1, 1, headers.length).setValues([currentRowValues]);
       cache.remove("all_data_json");
       writeAuditLog();
       return ContentService.createTextOutput(JSON.stringify({success: true, message: "Updated successfully"})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Record not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'DELETE') {
    const idField = getIdField(sheetName);
    const rowIndex = findRowIndex(sheet, idField, data[idField]);
    
    if (rowIndex > -1) {
       sheet.deleteRow(rowIndex);
       cache.remove("all_data_json");
       writeAuditLog();
       return ContentService.createTextOutput(JSON.stringify({success: true, message: "Deleted successfully"})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Record not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  // ── ATOMIC TRANSACTIONS ────────────────────────────────────────────────────
  
  if (action === 'ISSUE_DIRECT' || action === 'APPROVE_ISSUE' || action === 'RETURN_ASSET') {
    const txSheet = ss.getSheetByName('Transactions');
    const eqSheet = ss.getSheetByName('Equipments');
    const txIdField = 'TransactionID';
    const eqIdField = 'EquipmentCode';
    
    // For direct issuance, we first ADD the transaction
    if (action === 'ISSUE_DIRECT') {
      const txHeaders = txSheet.getDataRange().getValues()[0];
      const newTxRow = txHeaders.map(h => {
        if (h === 'CreatedAt' && !data[h]) return new Date().toISOString();
        return data[h] !== undefined ? data[h] : "";
      });
      txSheet.appendRow(newTxRow);
    }

    const txRowIndex = findRowIndex(txSheet, txIdField, data.TransactionID);
    if (txRowIndex === -1) return ContentService.createTextOutput(JSON.stringify({success: false, error: "Transaction not found after add"})).setMimeType(ContentService.MimeType.JSON);
    
    const txHeaders = txSheet.getDataRange().getValues()[0];
    const txRow = txSheet.getDataRange().getValues()[txRowIndex - 1];
    const eqCode = txRow[txHeaders.indexOf('EquipmentCode')];
    const qty = Number(txRow[txHeaders.indexOf('Quantity')]);
    
    const eqRowIndex = findRowIndex(eqSheet, eqIdField, eqCode);
    if (eqRowIndex === -1) return ContentService.createTextOutput(JSON.stringify({success: false, error: "Equipment not found"})).setMimeType(ContentService.MimeType.JSON);
    
    const eqHeaders = eqSheet.getDataRange().getValues()[0];
    const eqRow = eqSheet.getDataRange().getValues()[eqRowIndex - 1];
    let currentEqQty = Number(eqRow[eqHeaders.indexOf('Quantity')]);
    
    if (action === 'APPROVE_ISSUE' || action === 'ISSUE_DIRECT') {
      // Update/Set Transaction Status info (In ISSUE_DIRECT it was already appended, but we ensure it's correct)
      txSheet.getRange(txRowIndex, txHeaders.indexOf('Status') + 1).setValue('Active');
      // Update Equipment Qty
      const newQty = Math.max(0, currentEqQty - qty);
      eqSheet.getRange(eqRowIndex, eqHeaders.indexOf('Quantity') + 1).setValue(newQty);
      if (newQty === 0) eqSheet.getRange(eqRowIndex, eqHeaders.indexOf('Status') + 1).setValue('Issued');
    } else {
      // Update Transaction Status
      txSheet.getRange(txRowIndex, txHeaders.indexOf('Status') + 1).setValue('Completed');
      txSheet.getRange(txRowIndex, txHeaders.indexOf('ReturnDate') + 1).setValue(new Date().toISOString());
      // Update Equipment Qty
      const newQty = currentEqQty + qty;
      eqSheet.getRange(eqRowIndex, eqHeaders.indexOf('Quantity') + 1).setValue(newQty);
      eqSheet.getRange(eqRowIndex, eqHeaders.indexOf('Status') + 1).setValue('Active');
    }
    
    cache.remove("all_data_json");
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Transaction processed atomically"})).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({success: false, error: "Unknown action"})).setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "System error or busy: " + err.message})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lock) {
      lock.releaseLock();
    }
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
}
