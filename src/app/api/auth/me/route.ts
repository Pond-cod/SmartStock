import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  try {
    const payload = await verifyToken(token);
    return NextResponse.json({
      authenticated: true,
      user: {
        Username: payload.username,
        Role: payload.role,
        FirstName: payload.firstName,
        LastName: payload.lastName,
        MustChangePassword: payload.mustChange
      }
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
