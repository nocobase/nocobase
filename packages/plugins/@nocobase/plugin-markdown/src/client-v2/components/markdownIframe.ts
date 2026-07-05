/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const iframePattern = /<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>|<iframe\b[^>]*\/?>/gi;

export function stripMarkdownIframes(value: string) {
  return String(value || '').replace(iframePattern, '');
}

export function stripMarkdownIframeTags(value: string) {
  return stripMarkdownIframes(value);
}

export function removeMarkdownIframes(container?: ParentNode | null) {
  container?.querySelectorAll?.('iframe').forEach((iframe) => {
    iframe.remove();
  });
}
