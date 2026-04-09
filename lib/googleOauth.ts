import { createRemoteJWKSet, jwtVerify } from "jose";
import crypto from "crypto";

const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function randomBase64Url(bytes = 32): string {
  return base64Url(crypto.randomBytes(bytes));
}

export function getGoogleOAuthConfig(): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() ?? "";
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth is not configured (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI).");
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthorizeUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", args.clientId);
  u.searchParams.set("redirect_uri", args.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", args.state);
  u.searchParams.set("code_challenge", args.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export function pkceChallengeS256(verifier: string): string {
  const h = crypto.createHash("sha256").update(verifier).digest();
  return base64Url(h);
}

export async function exchangeGoogleCodeForTokens(args: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ idToken: string; accessToken: string | null }> {
  const body = new URLSearchParams();
  body.set("code", args.code);
  body.set("client_id", args.clientId);
  body.set("client_secret", args.clientSecret);
  body.set("redirect_uri", args.redirectUri);
  body.set("grant_type", "authorization_code");
  body.set("code_verifier", args.codeVerifier);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json().catch(() => null)) as
    | {
        id_token?: string;
        access_token?: string;
        error?: string;
        error_description?: string;
      }
    | null;
  if (!res.ok || !json || !json.id_token) {
    const msg = json?.error_description || json?.error || `Token exchange failed (${res.status})`;
    throw new Error(msg);
  }
  return { idToken: json.id_token, accessToken: typeof json.access_token === "string" ? json.access_token : null };
}

export async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<{
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}> {
  const { payload } = await jwtVerify(idToken, jwks, {
    audience: clientId,
    issuer: Array.from(GOOGLE_ISSUERS),
  });
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  const emailVerified = payload.email_verified === true;
  const name = typeof payload.name === "string" ? payload.name : "";
  const picture = typeof payload.picture === "string" ? payload.picture : undefined;
  if (!sub || !email) {
    throw new Error("Google token missing required identity fields.");
  }
  return { sub, email, emailVerified, name, picture };
}

