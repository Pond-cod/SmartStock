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
      sheet: 'NONE', 
      token: gasSecretToken,
      data: {
        base64: body.base64,
        fileName: body.fileName || `IMG_${Date.now()}.png`,
        mimeType: body.mimeType || 'image/png',
        equipmentCode: body.equipmentCode
      }
    };

    // Increase timeout for image upload to 60 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = await res.json();
    return NextResponse.json(result);
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return NextResponse.json(
      { error: isTimeout ? 'อัปโหลดรูปภาพล่าช้ากว่ากำหนด (Timeout 60s) กรุณาลองใหม่อีกครั้ง' : 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message },
      { status: isTimeout ? 504 : 500 }
    );
  }
}
