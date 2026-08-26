/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type KeywordValue = string | number;

function trimKeyword(value: KeywordValue) {
  return typeof value === 'string' ? value.trim() : value;
}

function toKeywordText(value: KeywordValue) {
  return String(trimKeyword(value));
}

function isIntegerKeyword(value: string) {
  return /^[+-]?\d+$/.test(value);
}

function isNumberKeyword(value: string) {
  return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value);
}

export function normalizeKeywords(values: KeywordValue[], fieldInterface: string): KeywordValue[] {
  if (fieldInterface === 'integer' || fieldInterface === 'id') {
    return values.map(toKeywordText).filter(isIntegerKeyword);
  }

  if (fieldInterface === 'number') {
    return values.map(toKeywordText).filter(isNumberKeyword);
  }

  if (fieldInterface === 'percent') {
    return values
      .map(trimKeyword)
      .map((item) => parseFloat(String(item)))
      .filter((item) => !Number.isNaN(item));
  }

  return values.map(trimKeyword).filter((item) => item !== '');
}
