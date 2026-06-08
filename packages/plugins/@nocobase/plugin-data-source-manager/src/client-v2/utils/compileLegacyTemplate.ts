/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ReactNode } from 'react';

type TOptions = Record<string, unknown>;
type TFunction = (key: string, options?: TOptions) => string;

const LEGACY_T_TEMPLATE = /^\s*\{\{\s*t\s*\(\s*(['"])(.*?)\1(?:\s*,\s*([\s\S]*?))?\)\s*\}\}\s*$/;
const LEGACY_T_TEMPLATE_FRAGMENT = /\{\{\s*t\s*\(\s*(['"])(.*?)\1(?:\s*,\s*([\s\S]*?))?\)\s*\}\}/g;

function parseStringArray(source: string) {
  const values: string[] = [];
  source.replace(/(['"])(.*?)\1/g, (_item, _quote, value) => {
    values.push(value);
    return '';
  });
  return values.length ? values : undefined;
}

export function getLegacyTemplateKey(value: ReactNode) {
  return typeof value === 'string' ? value.match(LEGACY_T_TEMPLATE)?.[2] : undefined;
}

function parseTOptions(source?: string): TOptions | undefined {
  const value = source?.trim();
  if (!value) {
    return undefined;
  }

  try {
    const options = JSON.parse(value) as unknown;
    return options && typeof options === 'object' && !Array.isArray(options) ? (options as TOptions) : undefined;
  } catch {
    // Keep support for old templates like {{t("Space", { ns: "client" })}}.
  }

  const options: TOptions = {};
  const nsArrayMatch = value.match(/(?:^|[{,\s])ns\s*:\s*(\[[\s\S]*?\])/);
  if (nsArrayMatch?.[1]) {
    const ns = parseStringArray(nsArrayMatch[1]);
    if (ns) {
      options.ns = ns;
    }
  } else {
    const nsStringMatch = value.match(/(?:^|[{,\s])ns\s*:\s*(['"])(.*?)\1/);
    if (nsStringMatch?.[2]) {
      options.ns = nsStringMatch[2];
    }
  }

  const nsModeMatch = value.match(/(?:^|[{,\s])nsMode\s*:\s*(['"])(.*?)\1/);
  if (nsModeMatch?.[2]) {
    options.nsMode = nsModeMatch[2];
  }

  return Object.keys(options).length ? options : undefined;
}

export function compileLegacyTemplate(value: ReactNode, t: TFunction): ReactNode {
  if (typeof value !== 'string') {
    return value;
  }
  const match = value.match(LEGACY_T_TEMPLATE);
  if (match?.[2]) {
    return t(match[2], parseTOptions(match[3]));
  }

  return value.replace(LEGACY_T_TEMPLATE_FRAGMENT, (_source, _quote, key, options) => t(key, parseTOptions(options)));
}

export function preferLegacyTemplateTitle(value: ReactNode, templateTitle?: ReactNode): ReactNode {
  const templateKey = getLegacyTemplateKey(templateTitle);
  if (typeof value === 'string' && templateKey === value) {
    return templateTitle;
  }
  return value;
}

export function compileLegacyTemplateText(value: ReactNode, t: TFunction, fallback = '-'): string {
  const compiled = compileLegacyTemplate(value, t);
  if (compiled === undefined || compiled === null || compiled === '') {
    return fallback;
  }
  return typeof compiled === 'string' || typeof compiled === 'number' || typeof compiled === 'boolean'
    ? String(compiled)
    : fallback;
}
