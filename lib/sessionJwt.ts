import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "quote_session";

export { COOKIE_NAME };

function getJwtSecretKey(): Uint8Array {
  const s = process.env.JWT_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("JWT_SECRET 未配置或长度不足（至少 16 字符）");
  }
  return new TextEncoder().encode(s);
}

export async function createSessionToken(userId: string, email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(getJwtSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<{ userId: string; email: string; issuedAt?: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const userId = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const issuedAt = typeof payload.iat === "number" ? payload.iat : undefined;
    if (!userId) return null;
    return { userId, email, issuedAt };
  } catch {
    return null;
  }
}
