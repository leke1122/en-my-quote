import pkg from "@/package.json";

export type ReleaseNoteItem = {
  date: string;
  summary: string[];
};

export const APP_VERSION = pkg.version;

/**
 * 版本说明（简单可读）
 * 维护方式：每次发布后在数组首项追加一条即可。
 */
export const RELEASE_NOTES: ReleaseNoteItem[] = [
  {
    date: "2026-04-07",
    summary: [
      "首页新增“版本说明”入口，方便查看更新。",
      "帮助页新增手机端截图展示区，点击图片可放大查看。",
      "“银行行号”统一改为“银行卡号”，避免用户理解歧义。",
      "报价、合同、商品、客户、我司信息在登录云端账号后会同步到数据库。",
      "商品图片上传增加压缩处理，减少因图片过大导致保存失败的问题。",
    ],
  },
];

