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

  // Mapping internal names to actual sheet names in the spreadsheet
  const nameMap = {
    'Personnel': 'Personnel', 
    'Departments': 'Departments',
    'RolePermissions': 'RolePermissions',
    'SystemLogs': 'SystemLogs'
  };

  if (sheetName === 'ALL') {
    const getSheetData = (sName) => {
      const actualName = nameMap[sName] || sName;
      const sheet = ss.getSheetByName(actualName);
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
      Transactions: getSheetData('Transactions'),
      RolePermissions: getSheetData('RolePermissions'),
      ActionRequests: getSheetData('ActionRequests'),
      'super Admin': getSheetData('super Admin'),
      SystemLogs: getSheetData('SystemLogs')
    };
    
    const resultJson = JSON.stringify(result);
    cache.put("all_data_json", resultJson, 30); // Faster refresh for approvals
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
  const callerRole = params.callerRole || "user";
  const needsApproval = params.needsApproval === true;
  const targetApprover = params.targetApprover || "admin_approve";
  
  if (token !== EXPECTED_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Unauthorized POST"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (!action || !data) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Missing parameters"})).setMimeType(ContentService.MimeType.JSON);
  }

  let lock = LockService.getScriptLock();
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'UPLOAD_IMAGE') {
      var folderId = '1IAYHdmp5GAu9ov-gX6yO1mTWLxsuyk97';
      var folder = DriveApp.getFolderById(folderId);
      var blob = Utilities.newBlob(Utilities.base64Decode(data.base64.split(',')[1] || data.base64), 'image/jpeg', data.fileName || 'IMG.jpg');
      var file = folder.createFile(blob);
      var fileId = file.getId();
      var imageUrl = "https://drive.google.com/uc?export=download&id=" + fileId;

      // AUTOMATIC LINKING: If equipmentCode is provided, update the sheet immediately
      if (data.equipmentCode) {
        var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        var eqSheet = ss.getSheetByName('Equipments');
        
        // RETRY MECHANISM: Wait for the record to be created by the main process
        var linked = false;
        for (var retry = 0; retry < 5; retry++) {
          if (retry > 0) Utilities.sleep(2000); // Wait 2s between retries
          
          var eqData = eqSheet.getDataRange().getValues();
          for (var i = 1; i < eqData.length; i++) {
            if (String(eqData[i][0]) === String(data.equipmentCode)) {
              eqSheet.getRange(i + 1, 9).setValue(imageUrl); // Column 9 is ImageURL
              linked = true;
              break;
            }
          }
          if (linked) break;
        }
        
        // Log the result for debugging in GAS
        console.log("Background Linking for " + data.equipmentCode + (linked ? " SUCCESS" : " FAILED (Record not found after 5 retries)"));
      }

      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        url: imageUrl,
        fileId: fileId 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    lock.waitLock(15000); // Wait up to 15 seconds for lock
    const cache = CacheService.getScriptCache();
    
    if (!sheetName || sheetName === 'NONE') {
      if (lock) lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({success: false, error: "Missing sheet name"})).setMimeType(ContentService.MimeType.JSON);
    }
  
  // Mapping internal names to actual sheet names in the spreadsheet
  const nameMap = {
    'Personnel': 'Personnel',
    'Departments': 'Departments',
    'RolePermissions': 'RolePermissions',
    'super Admin': 'super Admin',
    'SystemLogs': 'SystemLogs'
  };
  
  const actualSheetName = nameMap[sheetName] || sheetName;
  const sheet = ss.getSheetByName(actualSheetName);
  if (!sheet) {
    if (actualSheetName === 'SystemLogs') {
      ss.insertSheet('SystemLogs'); // Create SystemLogs if it doesn't exist
    } else {
      return ContentService.createTextOutput(JSON.stringify({success: false, error: "Sheet not found: " + actualSheetName})).setMimeType(ContentService.MimeType.JSON);
    }
  }

  const ensureHeaders = (sh, dataKeys) => {
    let shHeaders = [];
    if (sh.getLastRow() > 0) {
      shHeaders = sh.getDataRange().getValues()[0];
    }
    const newHeaders = [...shHeaders];
    let changed = false;
    dataKeys.forEach(k => {
      if (newHeaders.indexOf(k) === -1 && k !== 'token' && k !== 'caller' && k !== 'action' && k !== 'sheet' && k !== 'callerRole' && k !== 'needsApproval' && k !== 'targetApprover') {
        newHeaders.push(k);
        changed = true;
      }
    });
    if (changed) {
      if (shHeaders.length === 0) {
        sh.appendRow(newHeaders);
      } else {
        sh.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      }
    }
    return newHeaders;
  };

  const writeSystemLog = (actionType, targetSheet, beforeData, afterData, description) => {
    try {
      let logSheet = ss.getSheetByName('SystemLogs');
      if (!logSheet) {
         logSheet = ss.insertSheet('SystemLogs');
      }
      const headers = ensureHeaders(logSheet, ['LogID', 'Timestamp', 'UserIdentity', 'ActionType', 'Module', 'DataDiff', 'Description']);
      const diffStr = JSON.stringify({ before: beforeData, after: afterData });
      const userIdentity = caller + ' (' + callerRole + ')';
      
      const logRow = headers.map(h => {
        if (h === 'LogID') return `LOG-${Date.now()}`;
        if (h === 'Timestamp') return new Date().toISOString();
        if (h === 'UserIdentity') return userIdentity;
        if (h === 'ActionType') return actionType;
        if (h === 'Module') return targetSheet;
        if (h === 'DataDiff') return diffStr;
        if (h === 'Description') return description;
        return "";
      });
      logSheet.appendRow(logRow);
    } catch(e) { console.error("System log failed", e); }
  };

  const findRowIndex = (sh, field, id) => {
    if (sh.getLastRow() === 0) return -1;
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
    if (sName === 'RolePermissions') return 'RoleName';
    if (sName === 'ActionRequests') return 'RequestID';
    if (sName === 'super Admin') return 'Username';
    return null;
  };

  const getRowObject = (sh, idField, id) => {
    if (!sh || sh.getLastRow() === 0) return null;
    const headers = sh.getDataRange().getValues()[0];
    const rows = sh.getDataRange().getValues();
    const colIdx = headers.indexOf(idField);
    if (colIdx === -1) return null;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][colIdx] == id) {
        let obj = {};
        headers.forEach((h, j) => obj[h] = rows[i][j]);
        return obj;
      }
    }
    return null;
  };

  // --- MAKER CHECKER INTERCEPT ---
  if (needsApproval && (action === 'ADD' || action === 'EDIT' || action === 'DELETE')) {
    let beforeData = null;
    const idField = getIdField(sheetName);
    if (action === 'EDIT' || action === 'DELETE') {
       beforeData = getRowObject(ss.getSheetByName(actualSheetName), idField, data[idField]);
    }

    const reqSheet = ss.getSheetByName('ActionRequests');
    const reqHeaders = ensureHeaders(reqSheet, [
      'RequestID', 'CreatedAt', 'RequesterUser', 'RequesterRole', 'ActionType', 'TargetSheet', 
      'Payload', 'DataDiff', 'Status', 'TargetApprover', 'ApproverUser', 'ApprovedAt'
    ]);
    
    const diffStr = JSON.stringify({ before: beforeData, after: data });
    const reqRow = reqHeaders.map(h => {
       if (h === 'RequestID') return `REQ-${Date.now()}`;
       if (h === 'CreatedAt') return new Date().toISOString();
       if (h === 'RequesterUser') return caller;
       if (h === 'RequesterRole') return callerRole;
       if (h === 'ActionType') return action;
       if (h === 'TargetSheet') return sheetName;
       if (h === 'Payload') return JSON.stringify(data);
       if (h === 'DataDiff') return diffStr;
       if (h === 'Status') return 'Pending';
       if (h === 'TargetApprover') return targetApprover;
       return "";
    });
    reqSheet.appendRow(reqRow);
    cache.remove("all_data_json");
    writeSystemLog('REQUEST_'+action, sheetName, beforeData, data, `Requested ${action} (Pending ${targetApprover})`);
    return ContentService.createTextOutput(JSON.stringify({success: true, isRequest: true, message: `ส่งคำขอเรียบร้อยแล้ว รอการอนุมัติจาก ${targetApprover}`})).setMimeType(ContentService.MimeType.JSON);
  }

  // --- DIRECT ACTIONS ---
  if (action === 'ADD') {
    const activeSheet = ss.getSheetByName(actualSheetName);
    const headers = ensureHeaders(activeSheet, Object.keys(data));
    const newRow = headers.map(h => {
      if (h === 'CreatedAt' && !data[h]) {
        return new Date().toISOString();
      }
      return data[h] !== undefined ? data[h] : "";
    });
    activeSheet.appendRow(newRow);
    cache.remove("all_data_json");
    writeSystemLog('ADD', sheetName, null, data, `Added new record`);
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Added successfully"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'EDIT') {
    const activeSheet = ss.getSheetByName(actualSheetName);
    const headers = ensureHeaders(activeSheet, Object.keys(data));
    const idField = getIdField(sheetName);
    const rowId = data[idField];
    const beforeData = getRowObject(activeSheet, idField, rowId);
    
    const rowIndex = findRowIndex(activeSheet, idField, rowId);
    if (rowIndex > -1) {
       const rows = activeSheet.getDataRange().getValues();
       const currentRowValues = rows[rowIndex - 1];
       const expandedRowValues = new Array(headers.length).fill("");
       currentRowValues.forEach((v, i) => expandedRowValues[i] = v);

       headers.forEach((h, i) => {
          if (data[h] !== undefined && h !== 'CreatedAt') {
             expandedRowValues[i] = data[h];
          }
       });
       activeSheet.getRange(rowIndex, 1, 1, headers.length).setValues([expandedRowValues]);
       cache.remove("all_data_json");
       writeSystemLog('EDIT', sheetName, beforeData, data, `Edited record`);
       return ContentService.createTextOutput(JSON.stringify({success: true, message: "Updated successfully"})).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Record not found"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'DELETE') {
    const activeSheet = ss.getSheetByName(actualSheetName);
    const idField = getIdField(sheetName);
    const rowId = data[idField];
    const beforeData = getRowObject(activeSheet, idField, rowId);
    const rowIndex = findRowIndex(activeSheet, idField, rowId);
    
    if (rowIndex > -1) {
       activeSheet.deleteRow(rowIndex);
       cache.remove("all_data_json");
       writeSystemLog('DELETE', sheetName, beforeData, null, `Deleted record`);
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
    let txBeforeState = null;
    
    // For direct issuance, we first ADD the transaction
    if (action === 'ISSUE_DIRECT') {
      const txHeaders = txSheet.getDataRange().getValues()[0];
      const newTxRow = txHeaders.map(h => {
        if (h === 'CreatedAt' && !data[h]) return new Date().toISOString();
        return data[h] !== undefined ? data[h] : "";
      });
      txSheet.appendRow(newTxRow);
      txBeforeState = null;
    }

    const txRowIndex = findRowIndex(txSheet, txIdField, data.TransactionID);
    if (txRowIndex === -1) return ContentService.createTextOutput(JSON.stringify({success: false, error: "Transaction not found after add"})).setMimeType(ContentService.MimeType.JSON);
    
    if (action !== 'ISSUE_DIRECT') txBeforeState = getRowObject(txSheet, txIdField, data.TransactionID);

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
      txSheet.getRange(txRowIndex, txHeaders.indexOf('Status') + 1).setValue('Active');
      const newQty = Math.max(0, currentEqQty - qty);
      eqSheet.getRange(eqRowIndex, eqHeaders.indexOf('Quantity') + 1).setValue(newQty);
      if (newQty === 0) eqSheet.getRange(eqRowIndex, eqHeaders.indexOf('Status') + 1).setValue('Issued');
    } else {
      txSheet.getRange(txRowIndex, txHeaders.indexOf('Status') + 1).setValue('Completed');
      txSheet.getRange(txRowIndex, txHeaders.indexOf('ReturnDate') + 1).setValue(new Date().toISOString());
      const newQty = currentEqQty + qty;
      eqSheet.getRange(eqRowIndex, eqHeaders.indexOf('Quantity') + 1).setValue(newQty);
      eqSheet.getRange(eqRowIndex, eqHeaders.indexOf('Status') + 1).setValue('Active');
    }
    
    if (action !== 'ISSUE_DIRECT') {
      const txAfterState = getRowObject(txSheet, txIdField, data.TransactionID);
      writeSystemLog(action, 'Transactions', txBeforeState, txAfterState, `Processed Asset Transaction`);
    } else {
      const txAfterState = getRowObject(txSheet, txIdField, data.TransactionID);
      writeSystemLog(action, 'Transactions', null, txAfterState, `Issued Asset directly`);
    }

    cache.remove("all_data_json");
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Transaction processed atomically"})).setMimeType(ContentService.MimeType.JSON);
  }

  // ── APPROVAL EXECUTION ──────────────────────────────────────────────────
  if (action === 'EXECUTE_REQUEST') {
    const reqSheet = ss.getSheetByName('ActionRequests');
    const reqId = data.RequestID || data.ID;
    const reqBefore = getRowObject(reqSheet, 'RequestID', reqId);
    const reqIndex = findRowIndex(reqSheet, 'RequestID', reqId);
    if (reqIndex === -1) return ContentService.createTextOutput(JSON.stringify({success: false, error: "Request not found"})).setMimeType(ContentService.MimeType.JSON);
    
    const reqHeaders = reqSheet.getDataRange().getValues()[0];
    const reqRow = reqSheet.getDataRange().getValues()[reqIndex - 1];
    
    const targetAction = reqRow[reqHeaders.indexOf('ActionType')];
    const targetSheetName = reqRow[reqHeaders.indexOf('TargetSheet')];
    const targetPayload = JSON.parse(reqRow[reqHeaders.indexOf('Payload')]);
    
    const targetActualName = nameMap[targetSheetName] || targetSheetName;
    const targetSheet = ss.getSheetByName(targetActualName);
    if (!targetSheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: "Target sheet not found"})).setMimeType(ContentService.MimeType.JSON);

    let beforeData = null;
    const targetIdField = getIdField(targetSheetName);

    if (targetAction === 'ADD') {
      const headers = ensureHeaders(targetSheet, Object.keys(targetPayload));
      const newRowData = headers.map(h => {
        if (h === 'CreatedAt' && !targetPayload[h]) return new Date().toISOString();
        return targetPayload[h] !== undefined ? targetPayload[h] : "";
      });
      targetSheet.appendRow(newRowData);
    } 
    else if (targetAction === 'EDIT') {
      const headers = ensureHeaders(targetSheet, Object.keys(targetPayload));
      const targetIndex = findRowIndex(targetSheet, targetIdField, targetPayload[targetIdField]);
      if (targetIndex > -1) {
        beforeData = getRowObject(targetSheet, targetIdField, targetPayload[targetIdField]);
        const rows = targetSheet.getDataRange().getValues();
        const expandedRowValues = new Array(headers.length).fill("");
        rows[targetIndex-1].forEach((v, i) => expandedRowValues[i] = v);
        headers.forEach((h, i) => {
          if (targetPayload[h] !== undefined && h !== 'CreatedAt') expandedRowValues[i] = targetPayload[h];
        });
        targetSheet.getRange(targetIndex, 1, 1, headers.length).setValues([expandedRowValues]);
      }
    }
    else if (targetAction === 'DELETE') {
      const targetIndex = findRowIndex(targetSheet, targetIdField, targetPayload[targetIdField]);
      if (targetIndex > -1) {
        beforeData = getRowObject(targetSheet, targetIdField, targetPayload[targetIdField]);
        targetSheet.deleteRow(targetIndex);
      }
    }

    // Update Request Status
    reqSheet.getRange(reqIndex, reqHeaders.indexOf('Status') + 1).setValue('Approved');
    reqSheet.getRange(reqIndex, reqHeaders.indexOf('ApproverUser') + 1).setValue(caller);
    reqSheet.getRange(reqIndex, reqHeaders.indexOf('ApprovedAt') + 1).setValue(new Date().toISOString());
    
    writeSystemLog('APPROVE_'+targetAction, targetSheetName, beforeData, targetPayload, `Approved request ${reqId}`);
    
    cache.remove("all_data_json");
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Request approved and executed"})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'REJECT_REQUEST') {
    const reqSheet = ss.getSheetByName('ActionRequests');
    const reqId = data.RequestID || data.ID;
    const reqIndex = findRowIndex(reqSheet, 'RequestID', reqId);
    if (reqIndex === -1) return ContentService.createTextOutput(JSON.stringify({success: false, error: "Request not found"})).setMimeType(ContentService.MimeType.JSON);

    const reqHeaders = reqSheet.getDataRange().getValues()[0];
    reqSheet.getRange(reqIndex, reqHeaders.indexOf('Status') + 1).setValue('Rejected');
    reqSheet.getRange(reqIndex, reqHeaders.indexOf('ApproverUser') + 1).setValue(caller);
    reqSheet.getRange(reqIndex, reqHeaders.indexOf('ApprovedAt') + 1).setValue(new Date().toISOString());

    writeSystemLog('REJECT_REQUEST', 'ActionRequests', null, {RequestID: reqId}, `Rejected request ${reqId}`);

    cache.remove("all_data_json");
    return ContentService.createTextOutput(JSON.stringify({success: true, message: "Request rejected"})).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({success: false, error: "Unknown action"})).setMimeType(ContentService.MimeType.JSON);

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

function setupPermissions() {
  // Dummy call to force Google Apps Script to request DriveApp full scopes during authorization
  try { 
    DriveApp.getFiles(); 
    DriveApp.getFoldersByName('x');
    DriveApp.createFolder('x');
  } catch (e) {}

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // ensure RolePermissions sheet exists
  let rpSheet = ss.getSheetByName('RolePermissions');
  if (!rpSheet) {
    rpSheet = ss.insertSheet('RolePermissions');
  }

  const defaultHeaders = [
    'RoleName', 'Dashboard', 'Categories', 'Equipments', 'Requisitions',
    'Transactions', 'Reports', 'MasterData', 'Users', 'ActionRequests', 'ApproverLine'
  ];
  
  if (rpSheet.getLastRow() === 0) {
    rpSheet.appendRow(defaultHeaders);
  }

  const data = rpSheet.getDataRange().getValues();
  const existingRoles = data.length > 1 ? data.slice(1).map(r => r[0]) : [];

  // Insert default 'user' role
  if (!existingRoles.includes('user')) {
    rpSheet.appendRow([
      'user',
      'view',          // Dashboard
      'view',          // Categories
      'view',          // Equipments
      'view,create',   // Requisitions
      'view',          // Transactions
      'view',          // Reports
      '',              // MasterData
      '',              // Users
      '',              // ActionRequests
      'admin_approve'  // ApproverLine
    ]);
  }

  // Insert default 'admin_approve' role
  if (!existingRoles.includes('admin_approve')) {
    rpSheet.appendRow([
      'admin_approve',
      'view',          // Dashboard
      'view,create,edit,delete', // Categories
      'view,create,edit,delete', // Equipments
      'view,create',   // Requisitions
      'view,approve',  // Transactions
      'view',          // Reports
      '',              // MasterData
      '',              // Users
      'view,approve',  // ActionRequests
      'Admin'          // ApproverLine
    ]);
  }
  
  return "Setup Permissions completed.";
}
