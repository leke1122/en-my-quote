/**
 * 创建/更新本地测试账号（勿用于生产公网环境）。
 *
 * 用法：配置 DATABASE_URL 后执行
 *   npx prisma db seed
 *
 * 可通过环境变量覆盖（推荐生产不要用默认密码）：
 *   SEED_TEST_EMAIL、SEED_TEST_PASSWORD
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = (process.env.SEED_TEST_EMAIL ?? "1120689291@qq.com").trim().toLowerCase();
const plainPassword = process.env.SEED_TEST_PASSWORD ?? "qwe123456";
const trialDays = Math.min(Math.max(Number(process.env.SUBSCRIPTION_TRIAL_DAYS) || 14, 1), 365);

function trialEndDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const validUntil = trialEndDate(trialDays);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      subscription: {
        create: {
          plan: "trial",
          status: "active",
          validFrom: new Date(),
          validUntil,
          provider: "seed",
        },
      },
    },
  });

  const u = await prisma.user.findUnique({
    where: { email },
    include: { subscription: true },
  });
  if (u && !u.subscription) {
    await prisma.subscription.create({
      data: {
        userId: u.id,
        plan: "trial",
        status: "active",
        validFrom: new Date(),
        validUntil,
        provider: "seed",
      },
    });
  }

  console.info(`[seed] 用户已就绪：${email}（若已存在则已重置密码）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
