/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function mergeQueryString(url: string, params: { name: string; value: any }[]): string {
  const questionIndex = url.indexOf('?');
  const path = questionIndex >= 0 ? url.slice(0, questionIndex) : url;
  const search = questionIndex >= 0 ? url.slice(questionIndex + 1) : '';
  const searchParams = new URLSearchParams(search);

  for (const { name, value } of params) {
    searchParams.set(name, String(value));
  }

  const nextSearch = searchParams.toString();
  return nextSearch ? `${path}?${nextSearch}` : path;
}

export function joinUrlSearch(url: string, params: { name: string; value: any }[] = []): string {
  if (!params?.length) return url;

  const filtered = params.filter((p) => p.name && p.value !== undefined && p.value !== null && p.value !== '');
  if (!filtered.length) return url;

  const hashIndex = url.indexOf('#');
  const hasHash = hashIndex >= 0;
  const path = hasHash ? url.slice(0, hashIndex) : url;
  const hash = hasHash ? url.slice(hashIndex + 1) : '';
  const isHashRoute = hash.startsWith('/') || hash.startsWith('!/');

  if (hasHash && isHashRoute) {
    return `${path}#${mergeQueryString(hash, filtered)}`;
  }

  const nextPath = mergeQueryString(path, filtered);
  return hasHash ? `${nextPath}#${hash}` : nextPath;
}
