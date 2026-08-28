/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function stripMarkdownIframeTags(markdown: string) {
  if (!markdown) {
    return markdown;
  }

  let result = '';
  let cursor = 0;

  while (cursor < markdown.length) {
    const iframeStart = markdown.slice(cursor).search(/<iframe\b/i);
    if (iframeStart === -1) {
      result += markdown.slice(cursor);
      break;
    }

    const start = cursor + iframeStart;
    result += markdown.slice(cursor, start);

    const openingEnd = findTagEnd(markdown, start);
    if (openingEnd === -1) {
      break;
    }

    const openingTag = markdown.slice(start, openingEnd + 1);
    if (/\/\s*>$/.test(openingTag)) {
      cursor = openingEnd + 1;
      continue;
    }

    const closingStart = markdown.slice(openingEnd + 1).search(/<\/iframe\s*>/i);
    if (closingStart === -1) {
      break;
    }

    cursor =
      openingEnd + 1 + closingStart + markdown.slice(openingEnd + 1 + closingStart).match(/^<\/iframe\s*>/i)[0].length;
  }

  return result;
}

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

function findTagEnd(html: string, start: number) {
  let quote: string | undefined;

  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (quote) {
      if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '>') {
      return index;
    }
  }

  return -1;
}
