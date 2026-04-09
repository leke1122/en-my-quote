"use client";

import { createContext, useContext, useMemo } from "react";
import { createTranslator, DEFAULT_LOCALE, type Locale, type MessageKey } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale?: Locale;
  children: React.ReactNode;
}) {
  const effectiveLocale = locale ?? DEFAULT_LOCALE;
  const t = useMemo(() => createTranslator(effectiveLocale), [effectiveLocale]);
  const value = useMemo(() => ({ locale: effectiveLocale, t }), [effectiveLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) return createTranslator(DEFAULT_LOCALE);
  return ctx.t;
}

