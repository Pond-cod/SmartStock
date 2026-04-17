import * as jose from 'jose';

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('[AUTH] JWT_SECRET environment variable is not configured. Server cannot start securely.');
  }
  return new TextEncoder().encode(secret);
}

export async function verifyToken(token: string): Promise<jose.JWTPayload> {
  const { payload } = await jose.jwtVerify(token, getSecret());
  return payload;
}

export async function signToken(payload: Record<string, unknown>, expiresIn: string = '8h'): Promise<string> {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}
