import WxPay from "wechatpay-node-v3";

function envText(name: string): string | null {
  const v = process.env[name];
  if (!v) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function envPem(name: string): string | null {
  const raw = envText(name);
  if (!raw) return null;
  return raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
}

export function getWechatPayClient(): {
  ok: true;
  pay: WxPay;
  appid: string;
  mchid: string;
  notifyUrl: string;
  apiV3Key: string;
} | { ok: false; error: string } {
  const appid = envText("WXPAY_APPID");
  const mchid = envText("WXPAY_MCHID");
  const serial_no = envText("WXPAY_SERIAL_NO");
  const publicKey = envPem("WXPAY_PUBLIC_KEY_PEM");
  const privateKey = envPem("WXPAY_PRIVATE_KEY_PEM");
  const notifyUrl = envText("WXPAY_NOTIFY_URL");
  const apiV3Key = envText("WXPAY_API_V3_KEY");

  if (!appid) return { ok: false, error: "缺少环境变量 WXPAY_APPID" };
  if (!mchid) return { ok: false, error: "缺少环境变量 WXPAY_MCHID" };
  if (!publicKey) return { ok: false, error: "缺少环境变量 WXPAY_PUBLIC_KEY_PEM" };
  if (!privateKey) return { ok: false, error: "缺少环境变量 WXPAY_PRIVATE_KEY_PEM" };
  if (!notifyUrl) return { ok: false, error: "缺少环境变量 WXPAY_NOTIFY_URL" };
  if (!apiV3Key) return { ok: false, error: "缺少环境变量 WXPAY_API_V3_KEY" };

  const pay = new WxPay({
    appid,
    mchid,
    serial_no: serial_no ?? undefined,
    publicKey: Buffer.from(publicKey),
    privateKey: Buffer.from(privateKey),
    key: apiV3Key,
  });

  return { ok: true, pay, appid, mchid, notifyUrl, apiV3Key };
}

