import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';

const GAS_URL = process.env.GAS_URL;
const GAS_SECRET_TOKEN = process.env.GAS_SECRET_TOKEN;

async function fetchGASWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res;
    } catch (err: any) {
      clearTimeout(timeout);
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}

export async function POST(request: Request) {
  if (!GAS_URL || !GAS_SECRET_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล (Missing URL or Token)' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุชื่อผู้ใช้งานและรหัสผ่าน' },
        { status: 400 }
      );
    }

    let users: any[] = [];
    let superAdmins: any[] = [];
    try {
      const [resUsers, resSuper] = await Promise.all([
        fetchGASWithRetry(`${GAS_URL}?sheet=Users&token=${GAS_SECRET_TOKEN}`),
        fetchGASWithRetry(`${GAS_URL}?sheet=super%20Admin&token=${GAS_SECRET_TOKEN}`)
      ]);
      users = await resUsers.json();
      superAdmins = await resSuper.json();
    } catch (err: any) {
      return NextResponse.json(
        { success: false, error: 'ระบบฐานข้อมูลไม่ตอบสนอง กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }

    if (!Array.isArray(users)) users = [];
    if (!Array.isArray(superAdmins)) superAdmins = [];

    const allAccounts = [...users, ...superAdmins];

    const user = allAccounts.find((u: any) =>
      String(u.Username).toLowerCase() === String(username).toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(String(password), String(user.Password));
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const token = await signToken({
      username: user.Username,
      role: user.Role,
      firstName: user.FirstName || '',
      lastName: user.LastName || '',
      mustChange: String(user.MustChangePassword || '').toUpperCase() === 'TRUE'
    }, '8h');

    const response = NextResponse.json({
      success: true,
      user: {
        Username: user.Username,
        Role: user.Role,
        FirstName: user.FirstName || '',
        LastName: user.LastName || '',
        MustChangePassword: String(user.MustChangePassword || '').toUpperCase() === 'TRUE'
      },
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
