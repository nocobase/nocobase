/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const htmlEscapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHTML(value: string) {
  return value.replace(/[&<>"']/g, (matched) => htmlEscapeMap[matched]);
}

export function getAppVersionHTML(version: unknown) {
  if (version === null || typeof version === 'undefined' || version === '') {
    return '';
  }

  return `<span class="nb-app-version">v${escapeHTML(String(version))}</span>`;
}
