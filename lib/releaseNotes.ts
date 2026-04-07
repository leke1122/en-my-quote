import pkg from "@/package.json";

export type ReleaseNoteItem = {
  version: string;
  datetime: string;
  summary: string[];
};

export const APP_VERSION = pkg.version;

/** 版本说明页最多展示的更新条数（不含更早历史，如需归档可单独保留文档）。 */
export const RELEASE_NOTES_DISPLAY_LIMIT = 8;

/**
 * 版本说明（简单可读）
 * 维护方式：每次发布后在数组首项追加一条即可；超过 8 条时旧记录仍在代码里但不会出现在页面。
 */
export const RELEASE_NOTES: ReleaseNoteItem[] = [
  {
    version: "0.1.3",
    datetime: "2026-04-09 12:00",
    summary: [
      "商品管理列表增加「历史报价单价」「历史合同单价」：根据已保存的报价单明细与合同标的明细，汇总每个商品的最低与最高成交单价（仅统计大于 0 的单价；报价行优先按商品 ID 匹配，否则按商品编码；合同行按商品编码匹配）。",
    ],
  },
  {
    version: "0.1.2",
    datetime: "2026-04-08 16:45",
    summary: [
      "分享报价/分享合同时会说明：因图片占用大，分享为不带商品图片的文字与金额版；链接里自动去掉行内图片，减少「数据过大」报错。",
      "新建报价里供方下拉里不再显示「· 默认」字样。",
      "报价与合同都支持「保存为默认条款」，下次新建时自动带入上次保存的条款。",
      "新建合同时不再自动带出多段预置条款，需要时自行添加即可。",
    ],
  },
  {
    version: "0.1.1",
    datetime: "2026-04-07 23:30",
    summary: [
      "首页新增“版本说明”入口，方便查看更新。",
      "帮助页新增手机端截图展示区，点击图片可放大查看。",
      "“银行行号”统一改为“银行卡号”，避免用户理解歧义。",
      "报价、合同、商品、客户、我司信息在登录云端账号后会同步到数据库。",
      "商品图片上传增加压缩处理，减少因图片过大导致保存失败的问题。",
    ],
  },
];

/** 用于页面展示：仅最近若干条。 */
export function getRecentReleaseNotes(): ReleaseNoteItem[] {
  return RELEASE_NOTES.slice(0, RELEASE_NOTES_DISPLAY_LIMIT);
}

