/**
 * 新注册用户默认订阅：无试用，需兑换激活码后由 redeem 写入正式套餐。
 * 后续若恢复「邮箱验证注册」，注册接口应使用同一套初始值，避免与密码注册不一致。
 */
export const REGISTRATION_SUBSCRIPTION_CREATE = {
  plan: "unactivated",
  status: "pending",
  validFrom: null,
  validUntil: null,
  provider: "manual",
} as const;
