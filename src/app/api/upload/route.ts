import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

const GAS_URL = process.env.GAS_URL;

export async function POST(request: Request) {
  if (!GAS_URL) {
    return NextResponse.json({ error: 'ไม่ได้ตั้งค่า GAS_URL' }, { status: 500 });
  }

  try {
    const token = cookies().get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 });
    }
    await verifyToken(token);
  } catch {
    return NextResponse.json({ error: 'ไม่ได้รับอนุญาต (Token ไม่ถูกต้อง)' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const gasSecretToken = process.env.GAS_SECRET_TOKEN || 'INVENTORY_SECURE_TOKEN_2026';

    const payload = {
      action: 'UPLOAD_IMAGE',
      sheet: 'NONE', // Just to satisfy any middle layers, though our script doesn't strictly check if action is UPLOAD_IMAGE
      token: gasSecretToken,
      data: {
        base64: body.base64,
        fileName: body.fileName || `IMG_${Date.now()}.png`,
        mimeType: body.mimeType || 'image/png'
      }
    };

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message },
      { status: 500 }
    );
  }
}
