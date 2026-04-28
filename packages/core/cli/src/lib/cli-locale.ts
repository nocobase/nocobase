/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SUPPORTED_CLI_LOCALES = ['en-US', 'zh-CN'] as const;
export type CliLocale = typeof SUPPORTED_CLI_LOCALES[number];
export const CLI_LOCALE_FLAG_OPTIONS = [...SUPPORTED_CLI_LOCALES];
export const CLI_LOCALE_FLAG_DESCRIPTION =
  'Language for CLI prompts and the local setup UI.';

export type LocalizedTextDef = {
  key: string;
  values?: Record<string, unknown>;
  fallback?: string;
};

export type LocalizedText = string | LocalizedTextDef;

export type CliTranslateFn = (
  key: string,
  values?: Record<string, unknown>,
  fallback?: string,
) => string;

const DEFAULT_CLI_LOCALE: CliLocale = 'en-US';

type LocaleMessages = Record<string, unknown>;

const localeCache: Partial<Record<CliLocale, LocaleMessages>> = {};

function normalizeCliLocale(value: string | null | undefined): CliLocale | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return undefined;
  }

  const normalized = raw.replace(/\..*$/, '').replace(/_/g, '-').toLowerCase();
  if (normalized === 'zh' || normalized.startsWith('zh-')) {
    return 'zh-CN';
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en-US';
  }

  return undefined;
}

function loadLocaleMessages(locale: CliLocale): LocaleMessages {
  if (localeCache[locale]) {
    return localeCache[locale] as LocaleMessages;
  }

  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const fallbackPath = path.resolve(moduleDir, '..', 'locale', `${locale}.json`);
  const fileUrl = new URL(`../locale/${locale}.json`, import.meta.url);
  let parsed: LocaleMessages;

  try {
    parsed = JSON.parse(readFileSync(fileUrl, 'utf8')) as LocaleMessages;
  } catch (error: unknown) {
    const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code !== 'ENOENT') {
      throw error;
    }
    parsed = JSON.parse(readFileSync(fallbackPath, 'utf8')) as LocaleMessages;
  }

  localeCache[locale] = parsed;
  return parsed;
}

function getPathValue(input: unknown, path: string): unknown {
  let current = input;
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object' || !Object.prototype.hasOwnProperty.call(current, part)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function interpolateTemplate(template: string, values?: Record<string, unknown>): string {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const value = getPathValue(values, key);
    return value === undefined || value === null ? '' : String(value);
  });
}

export function detectCliLocale(): CliLocale {
  const candidates = [
    process.env.NB_LOCALE,
    process.env.LC_ALL,
    process.env.LC_MESSAGES,
    process.env.LANG,
    Intl.DateTimeFormat().resolvedOptions().locale,
  ];

  for (const candidate of candidates) {
    const locale = normalizeCliLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return DEFAULT_CLI_LOCALE;
}

export function resolveCliLocale(preferred?: string | null): CliLocale {
  return normalizeCliLocale(preferred) ?? detectCliLocale();
}

export function applyCliLocale(preferred?: string | null): CliLocale {
  const locale = resolveCliLocale(preferred);
  process.env.NB_LOCALE = locale;
  return locale;
}

export function createCliTranslate(preferred?: string | null): CliTranslateFn {
  const locale = resolveCliLocale(preferred);
  return (key, values, fallback) => {
    const messages = loadLocaleMessages(locale);
    const template = getPathValue(messages, key);
    if (typeof template !== 'string') {
      return interpolateTemplate(fallback ?? key, values);
    }
    return interpolateTemplate(template, values);
  };
}

export function translateCli(
  key: string,
  values?: Record<string, unknown>,
  options?: {
    locale?: string | null;
    fallback?: string;
  },
): string {
  return createCliTranslate(options?.locale)(key, values, options?.fallback);
}

export function localeText(
  key: string,
  values?: Record<string, unknown>,
  fallback?: string,
): LocalizedTextDef {
  return {
    key,
    ...(values ? { values } : {}),
    ...(fallback ? { fallback } : {}),
  };
}

export function isLocalizedTextDef(value: unknown): value is LocalizedTextDef {
  return Boolean(
    value
      && typeof value === 'object'
      && typeof (value as LocalizedTextDef).key === 'string',
  );
}

export function resolveLocalizedText(
  text: LocalizedText | undefined,
  options?: {
    locale?: string | null;
    fallback?: string;
  },
): string {
  if (text === undefined) {
    return options?.fallback ?? '';
  }
  if (typeof text === 'string') {
    return text;
  }
  return translateCli(text.key, text.values, {
    locale: options?.locale,
    fallback: text.fallback ?? options?.fallback,
  });
}
