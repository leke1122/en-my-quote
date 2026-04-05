const DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"] as const;
const UNITS = ["", "拾", "佰", "仟"] as const;

function fourDigitsToCn(n: number): string {
  if (n < 0 || n > 9999) return "";
  if (n === 0) return "";
  let s = "";
  let needZero = false;
  for (let i = 0; i < 4; i++) {
    const p = 3 - i;
    const d = Math.floor(n / 10 ** p) % 10;
    if (d === 0) {
      if (s && n % 10 ** (p + 1) !== 0) needZero = true;
    } else {
      if (needZero) {
        s += "零";
        needZero = false;
      }
      if (d === 1 && p === 1 && !s) s += "拾";
      else s += DIGITS[d] + UNITS[p];
    }
  }
  return s;
}

function integerToCn(n: number): string {
  if (n === 0) return "零";
  if (n < 0 || !Number.isFinite(n) || n > 999999999999) return "金额过大";
  const yi = Math.floor(n / 100000000);
  const wan = Math.floor((n % 100000000) / 10000);
  const ge = n % 10000;
  const parts: string[] = [];
  if (yi > 0) parts.push(fourDigitsToCn(yi) + "亿");
  if (wan > 0) {
    parts.push(fourDigitsToCn(wan) + "万");
  } else if (yi > 0 && ge > 0) {
    parts.push("零");
  }
  if (ge > 0) {
    const g = fourDigitsToCn(ge);
    if (wan > 0 && ge < 1000 && ge > 0) parts.push("零");
    parts.push(g);
  }
  return parts.join("") || "零";
}

/** 人民币金额大写（含元角分/整），用于合同合计 */
export function amountToChineseUppercase(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0) return "——";
  const cents = Math.round(amount * 100);
  const yuan = Math.floor(cents / 100);
  const jiao = Math.floor((cents % 100) / 10);
  const fen = cents % 10;
  let s = integerToCn(yuan) + "元";
  if (jiao === 0 && fen === 0) return s + "整";
  if (jiao !== 0) s += DIGITS[jiao] + "角";
  else if (fen !== 0) s += "零";
  if (fen !== 0) s += DIGITS[fen] + "分";
  return s;
}
