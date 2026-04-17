import { NextResponse } from 'next/server';

const GAS_URL = process.env.GAS_URL;
const GAS_SECRET_TOKEN = process.env.GAS_SECRET_TOKEN;

export async function GET() {
  if (!GAS_URL || !GAS_SECRET_TOKEN) {
    return NextResponse.json({ status: 'error', message: 'ไม่ได้ตั้งค่า GAS_URL หรือ Token' }, { status: 500 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${GAS_URL}?sheet=Categories&token=${GAS_SECRET_TOKEN}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    return NextResponse.json({ status: 'connected', message: 'เชื่อมต่อฐานข้อมูลสำเร็จ' }, { status: 200 });
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || err.message.includes('timeout');
    return NextResponse.json(
      { status: 'error', message: isTimeout ? 'ฐานข้อมูลไม่ตอบสนอง (Timeout)' : err.message },
      { status: 500 }
    );
  }
}
