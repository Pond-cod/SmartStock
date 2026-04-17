import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

const GAS_URL = process.env.GAS_URL;
const GAS_SECRET_TOKEN = process.env.GAS_SECRET_TOKEN;

const ALLOWED_SHEETS = new Set(['Categories', 'Equipments', 'Users', 'Settings', 'Transactions', 'ALL', 'Personnel', 'Departments', 'RolePermissions', 'super Admin']);
const ADMIN_ONLY_WRITE_SHEETS = new Set(['Users', 'Settings', 'Personnel', 'Departments', 'RolePermissions', 'super Admin']);

async function fetchGASWithRetry(url: string, options?: any, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err: any) {
      clearTimeout(timeout);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheet = searchParams.get('sheet');

  if (!sheet || !ALLOWED_SHEETS.has(sheet)) {
    return NextResponse.json({ error: 'พารามิเตอร์ Sheet ไม่ถูกต้อง' }, { status: 400 });
  }

  if (!GAS_URL || !GAS_SECRET_TOKEN) {
    return NextResponse.json({ error: 'ไม่ได้ตั้งค่า GAS_URL หรือ Token' }, { status: 500 });
  }

  try {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    await verifyToken(token);

    const res = await fetchGASWithRetry(`${GAS_URL}?sheet=${encodeURIComponent(sheet)}&token=${GAS_SECRET_TOKEN}`, {
      cache: 'no-store',
    });
    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
      },
    });
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || err.message.includes('timeout');
    return NextResponse.json(
      { error: isTimeout ? 'ฐานข้อมูลไม่ตอบสนอง (Timeout) กรุณาลองใหม่' : err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!GAS_URL || !GAS_SECRET_TOKEN) {
    return NextResponse.json({ error: 'ไม่ได้ตั้งค่า GAS_URL หรือ Token' }, { status: 500 });
  }

  let callerRole = 'user';
  let callerUsername = 'system';
  try {
    const token = cookies().get('auth_token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      callerRole = (payload.role as string) ?? 'user';
      callerUsername = (payload.username as string) ?? 'system';
    } else {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต (Unauthorized)' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาต (Token ไม่ถูกต้อง)' }, { status: 401 });
  }

  try {
    let body = await request.json();
    const { action, sheet, data } = body;

    const ALLOWED_SHEETS_ARR = [...ALLOWED_SHEETS];
    if (!sheet || !ALLOWED_SHEETS.has(sheet)) {
      return NextResponse.json({ error: 'ไม่สามารถใช้งาน Sheet นี้ได้' }, { status: 400 });
    }

    const SUPER_ADMIN_ONLY_SHEETS = new Set(['RolePermissions', 'super Admin', 'Settings']);

    if (ADMIN_ONLY_WRITE_SHEETS.has(sheet) && callerRole !== 'Admin' && callerRole !== 'super Admin') {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาตให้แก้ไขข้อมูลส่วนนี้' }, { status: 403 });
    }

    if (SUPER_ADMIN_ONLY_SHEETS.has(sheet) && callerRole !== 'super Admin') {
      return NextResponse.json({ error: 'Super Admin เท่านั้นที่สามารถแก้ไขข้อมูลส่วนนี้ได้' }, { status: 403 });
    }

    // ── MAKER-CHECKER REROUTING ──────────────────────────────────────────────
    
    let finalAction = action;
    let finalSheet = sheet;
    let finalData = data;

    const isDirectAction = action === 'ADD' || action === 'EDIT' || action === 'DELETE';
    
    if (isDirectAction) {
      let needsApproval = false;
      let targetApprover = 'admin_approve';

      if (callerRole === 'user') {
        needsApproval = true;
        targetApprover = 'admin_approve';
      } else if (callerRole === 'admin_approve' && action === 'DELETE') {
        needsApproval = true;
        targetApprover = 'Admin';
      }

      if (needsApproval && (sheet !== 'Transactions')) { 
        // Create an Action Request instead of direct execution
        finalAction = 'ADD';
        finalSheet = 'ActionRequests';
        finalData = {
          RequestID: `REQ-${Date.now()}`,
          CreatedAt: new Date().toISOString(),
          RequesterUser: callerUsername,
          RequesterRole: callerRole,
          ActionType: action,
          TargetSheet: sheet,
          Payload: JSON.stringify(data),
          Status: 'Pending',
          TargetApprover: targetApprover,
          ApproverUser: '',
          ApprovedAt: ''
        };
      }
    }

    if ((finalSheet === 'Users' || finalSheet === 'super Admin') && finalData?.Password) {
      if (!finalData.Password.startsWith('$2a$')) {
        finalData.Password = await bcrypt.hash(String(finalData.Password), 10);
      }
    }

    const payload = { action: finalAction, sheet: finalSheet, data: finalData, token: GAS_SECRET_TOKEN, caller: callerUsername };
    const res = await fetchGASWithRetry(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    
    // Supplement result with meta if it was a request
    if (finalSheet === 'ActionRequests' && result.success) {
      result.isRequest = true;
      result.message = 'ส่งคำขอเรียบร้อยแล้ว รอการอนุมัติจาก ' + finalData.TargetApprover;
    }

    return NextResponse.json(result);
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || err.message.includes('timeout');
    return NextResponse.json(
      { error: isTimeout ? 'ฐานข้อมูลไม่ตอบสนอง (Timeout) กรุณาลองใหม่' : err.message },
      { status: 500 }
    );
  }
}
