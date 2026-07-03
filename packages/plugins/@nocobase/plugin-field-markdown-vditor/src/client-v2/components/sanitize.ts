/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function stripMarkdownIframes(html: string) {
  if (!html || typeof DOMParser === 'undefined') {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('iframe').forEach((iframe) => iframe.remove());
  return doc.body.innerHTML;
}

export function removeMarkdownIframes(container?: ParentNode | null) {
  container?.querySelectorAll('iframe').forEach((iframe) => iframe.remove());
}
