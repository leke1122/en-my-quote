import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, createSessionToken } from "@/lib/sessionJwt";
import { REGISTRATION_SUBSCRIPTION_CREATE } from "@/lib/initialSubscriptionRegistration";
import {
  exchangeGoogleCodeForTokens,
  getGoogleOAuthConfig,
  randomBase64Url,
  verifyGoogleIdToken,
} from "@/lib/googleOauth";

export const runtime = "nodejs";

const COOKIE_STATE = "google_oauth_state";
const COOKIE_VERIFIER = "google_oauth_verifier";
const COOKIE_REDIRECT = "google_oauth_redirect";

function clearOauthCookies() {
  cookies().set(COOKIE_STATE, "", { path: "/", maxAge: 0 });
  cookies().set(COOKIE_VERIFIER, "", { path: "/", maxAge: 0 });
  cookies().set(COOKIE_REDIRECT, "", { path: "/", maxAge: 0 });
}

function safeRedirectPath(raw: string | null | undefined): string {
  const v = String(raw ?? "").trim();
  if (!v.startsWith("/")) return "/settings";
  if (v.startsWith("//")) return "/settings";
  if (v.startsWith("/api/")) return "/settings";
  return v;
}

export async function GET(request: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  if (err) {
    clearOauthCookies();
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Google sign-in was cancelled.")}`, url.origin));
  }
  if (!code || !state) {
    clearOauthCookies();
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Invalid Google sign-in callback.")}`, url.origin));
  }

  const savedState = cookies().get(COOKIE_STATE)?.value ?? "";
  const verifier = cookies().get(COOKIE_VERIFIER)?.value ?? "";
  const redirect = safeRedirectPath(cookies().get(COOKIE_REDIRECT)?.value);
  if (!savedState || state !== savedState || !verifier) {
    clearOauthCookies();
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Google sign-in session expired. Try again.")}`, url.origin));
  }

  let cfg: ReturnType<typeof getGoogleOAuthConfig>;
  try {
    cfg = getGoogleOAuthConfig();
  } catch {
    clearOauthCookies();
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Google OAuth is not configured.")}`, url.origin));
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens({
      code,
      codeVerifier: verifier,
      redirectUri: cfg.redirectUri,
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
    });
    const profile = await verifyGoogleIdToken(tokens.idToken, cfg.clientId);
    if (!profile.emailVerified) {
      clearOauthCookies();
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Google account email is not verified.")}`, url.origin));
    }

    const provider = "google";
    const providerUserId = profile.sub;

    const existingAccount = await prisma.authAccount.findUnique({
      where: { provider_providerUserId: { provider, providerUserId } },
      include: { user: { include: { subscription: true } } },
    });

    let userId: string;
    let userEmail: string;

    if (existingAccount) {
      userId = existingAccount.userId;
      userEmail = existingAccount.user.email;
    } else {
      // Link by email if user exists; otherwise create a new user.
      const existingUser = await prisma.user.findUnique({
        where: { email: profile.email },
        include: { subscription: true },
      });
      if (existingUser) {
        userId = existingUser.id;
        userEmail = existingUser.email;
      } else {
        const randomPw = randomBase64Url(32);
        const passwordHash = await bcrypt.hash(randomPw, 10);
        const created = await prisma.user.create({
          data: {
            email: profile.email,
            passwordHash,
            subscription: {
              create: { ...REGISTRATION_SUBSCRIPTION_CREATE },
            },
          },
        });
        userId = created.id;
        userEmail = created.email;
      }

      await prisma.authAccount.create({
        data: {
          userId,
          provider,
          providerUserId,
          email: profile.email,
        },
      });
    }

    const token = await createSessionToken(userId, userEmail);
    cookies().set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    clearOauthCookies();
    return NextResponse.redirect(new URL(redirect, url.origin));
  } catch {
    clearOauthCookies();
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("Google sign-in failed. Try again.")}`, url.origin));
  }
}

