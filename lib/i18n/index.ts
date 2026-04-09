import { enUS, type Messages } from "./messages/en-US";

export type Locale = "en-US";

export const DEFAULT_LOCALE: Locale = "en-US";

const MESSAGES: Record<Locale, Messages> = {
  "en-US": enUS,
};

type KeyPath<T> = T extends object
  ? {
      [K in Extract<keyof T, string>]: T[K] extends object ? `${K}` | `${K}.${KeyPath<T[K]>}` : `${K}`;
    }[Extract<keyof T, string>]
  : never;

export type MessageKey = KeyPath<Messages>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, seg) => (isRecord(acc) ? acc[seg] : undefined), obj);
}

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
}

export function createTranslator(locale: Locale) {
  const messages = getMessages(locale);
  return function t(key: MessageKey, vars?: Record<string, string | number>): string {
    const raw = getByPath(messages, key);
    const s = typeof raw === "string" ? raw : String(key);
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? `{${k}}` : String(vars[k])));
  };
}

