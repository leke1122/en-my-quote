import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/prisma";
import { COOKIE_NAME, verifySessionToken } from "@/lib/sessionJwt";
import { DATA_BACKUP_VERSION, type DataBackupPayload } from "@/lib/dataBackup";

export const runtime = "nodejs";

function emptyPayload(): DataBackupPayload {
  const now = new Date().toISOString();
  return {
    version: DATA_BACKUP_VERSION,
    exportedAt: now,
    app: "my-quote",
    companies: [],
    customers: [],
    products: [],
    quotes: [],
    quoteCounter: {},
    contracts: [],
    contractCounter: {},
    settings: {
      documentCurrency: "USD",
    },
  };
}

async function getSessionUserId() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const session = await verifySessionToken(raw);
  return session?.userId ?? null;
}

export async function GET() {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const row = await prisma.userProjectData.findUnique({ where: { userId } });
  const payload = row?.payload ?? emptyPayload();
  return NextResponse.json({ ok: true, payload, payloadVersion: row?.payloadVersion ?? DATA_BACKUP_VERSION });
}

export async function PUT(req: Request) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: "Database is not configured." }, { status: 503 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { payload?: unknown } | null;
  if (!body || typeof body !== "object" || !body.payload || typeof body.payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid request parameters." }, { status: 400 });
  }

  await prisma.userProjectData.upsert({
    where: { userId },
    update: {
      payload: body.payload as object,
      payloadVersion: DATA_BACKUP_VERSION,
    },
    create: {
      userId,
      payload: body.payload as object,
      payloadVersion: DATA_BACKUP_VERSION,
    },
  });

  return NextResponse.json({ ok: true });
}

