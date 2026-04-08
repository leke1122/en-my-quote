import { execSync } from "node:child_process";

const url = (process.env.DATABASE_URL || "").trim();
if (!url) {
  console.log("[prisma] DATABASE_URL not set, skip migrate deploy");
  process.exit(0);
}

try {
  console.log("[prisma] Running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch (e) {
  console.error("[prisma] migrate deploy failed");
  throw e;
}

