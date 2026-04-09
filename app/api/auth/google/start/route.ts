import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildGoogleAuthorizeUrl, getGoogleOAuthConfig, pkceChallengeS256, randomBase64Url } from "@/lib/googleOauth";

export const runtime = "nodejs";

const COOKIE_STATE = "google_oauth_state";
const COOKIE_VERIFIER = "google_oauth_verifier";
const COOKIE_REDIRECT = "google_oauth_redirect";

function safeRedirectPath(raw: string | null | undefined): string {
  const v = String(raw ?? "").trim();
  if (!v.startsWith("/")) return "/settings";
  if (v.startsWith("//")) return "/settings";
  if (v.startsWith("/api/")) return "/settings";
  return v;
}

export async function GET(request: Request) {
  let cfg: ReturnType<typeof getGoogleOAuthConfig>;
  try {
    cfg = getGoogleOAuthConfig();
  } catch (e) {
    const url = new URL(request.url);
    const redirect = safeRedirectPath(url.searchParams.get("redirect"));
    const msg =
      e instanceof Error
        ? e.message
        : "Google OAuth is not configured (GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI).";
    const login = new URL("/login", url.origin);
    login.searchParams.set("redirect", redirect);
    login.searchParams.set("error", msg);
    return NextResponse.redirect(login);
  }

  const url = new URL(request.url);
  const redirect = safeRedirectPath(url.searchParams.get("redirect"));

  const state = randomBase64Url(24);
  const verifier = randomBase64Url(48);
  const challenge = pkceChallengeS256(verifier);

  const maxAge = 10 * 60; // 10 minutes
  cookies().set(COOKIE_STATE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });
  cookies().set(COOKIE_VERIFIER, verifier, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });
  cookies().set(COOKIE_REDIRECT, redirect, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  });

  const authUrl = buildGoogleAuthorizeUrl({
    clientId: cfg.clientId,
    redirectUri: cfg.redirectUri,
    state,
    codeChallenge: challenge,
  });
  return NextResponse.redirect(authUrl);
}

