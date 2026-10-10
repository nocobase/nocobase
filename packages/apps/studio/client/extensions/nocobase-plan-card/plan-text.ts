/**
 * The plan card's own wording and the little it formats: its keys with their English defaults, a field's name, a time
 * relative to now, and the toasts of the plan actions. Values and failures read in the projects plugin's words
 * (`usePlanValueText`, `usePlanErrorText`), whatever namespace the card renders in.
 */
import { useToaster } from '@nocobase/app-client';
import { usePlanErrorText } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import enUS, { type PlanCardLocale } from './locales/en-US.js';

type Plural<K> = K extends `${infer Base}_one`
  ? Base
  : K extends `${infer Base}_other`
    ? Base
    : K;

/** A key of the plan card, without its plural suffix. */
export type PlanCardKey = Plural<keyof PlanCardLocale>;

export type PlanCardTranslate = (
  key: PlanCardKey,
  options?: Readonly<Record<string, unknown>>,
) => string;

export interface PlanCardText {
  readonly t: PlanCardTranslate;
  readonly language: string;
}

const resources = enUS as unknown as Readonly<
  Record<string, string | undefined>
>;

/** The card's wording in the namespace it renders in, each key falling back to its English text. */
export function usePlanCardText(): PlanCardText {
  const { t, i18n } = useTranslation();
  return useMemo(
    () => ({
      t: (key, options) => {
        const plural = options && typeof options.count === 'number';
        return t(key, {
          ...options,
          defaultValue: resources[plural ? `${key}_other` : key] ?? key,
          ...(plural ? { defaultValue_one: resources[`${key}_one`] } : {}),
        });
      },
      language: i18n.language,
    }),
    [t, i18n.language],
  );
}

const FIELDS: ReadonlySet<string> = new Set(
  Object.keys(enUS)
    .filter((key) => key.startsWith('planCard.fields.'))
    .map((key) => key.slice('planCard.fields.'.length)),
);

/** A field's name: a known one translated, any other as written. */
export function fieldLabel(t: PlanCardTranslate, field: string): string {
  return FIELDS.has(field)
    ? t(`planCard.fields.${field}` as PlanCardKey)
    : field;
}

const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 minutes ago" in `locale`; "now" under a minute. */
export function relativeTime(
  at: string,
  locale: string,
  now: number = Date.now(),
): string {
  const seconds = Math.round((new Date(at).getTime() - now) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS)
    if (Math.abs(seconds) >= size)
      return format.format(Math.round(seconds / size), unit);
  return format.format(0, 'second');
}

export interface PlanNotify {
  success(title: string): void;
  /** A failed request in the projects plugin's words, or `fallback` when it says nothing more precise. */
  error(error: unknown, fallback?: string): void;
}

/** The plan actions' toasts, through the application's toaster. */
export function usePlanNotify(): PlanNotify {
  const toaster = useToaster();
  const errors = usePlanErrorText();
  return useMemo(
    () => ({
      success: (title) => void toaster.show({ type: 'success', title }),
      error: (error, fallback) =>
        void toaster.show({
          type: 'error',
          title: errors.request(error, fallback),
        }),
    }),
    [toaster, errors],
  );
}
