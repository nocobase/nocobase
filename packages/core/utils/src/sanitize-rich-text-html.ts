/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import sanitizeHtml from 'sanitize-html';

type HtmlAttributes = Record<string, string>;

const imageDataUrlPattern = /^data:image\/(?:gif|jpe?g|png|webp);base64,[a-z\d+/=\s]+$/i;
const dimensionPattern = /^(?:\d{1,4}(?:\.\d+)?(?:px)?|(?:100|[1-9]?\d)(?:\.\d+)?%)$/;
const imageStyleDimensionPattern = /^(?:\d{1,4}(?:\.\d+)?px|(?:100|[1-9]?\d)(?:\.\d+)?%)$/;

function sanitizeLinkAttributes(attribs: HtmlAttributes) {
  const nextAttributes = { ...attribs };
  if (nextAttributes.target && !['_blank', '_self'].includes(nextAttributes.target)) {
    delete nextAttributes.target;
  }
  if (nextAttributes.target === '_blank') {
    nextAttributes.rel = 'noopener noreferrer';
  } else {
    delete nextAttributes.rel;
  }
  return nextAttributes;
}

function sanitizeImageAttributes(attribs: HtmlAttributes) {
  const nextAttributes = { ...attribs };
  if (nextAttributes.src?.trim().toLowerCase().startsWith('data:') && !imageDataUrlPattern.test(nextAttributes.src)) {
    delete nextAttributes.src;
  }
  for (const dimension of ['width', 'height']) {
    if (nextAttributes[dimension] && !dimensionPattern.test(nextAttributes[dimension])) {
      delete nextAttributes[dimension];
    }
  }
  return nextAttributes;
}

const richTextSanitizeOptions = {
  allowedTags: [
    'a',
    'b',
    'blockquote',
    'br',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'i',
    'img',
    'li',
    'ol',
    'p',
    's',
    'span',
    'strike',
    'strong',
    'u',
    'ul',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    span: ['style'],
  },
  allowedClasses: {
    li: [/^ql-indent-[1-9]$/],
  },
  allowedStyles: {
    img: {
      height: [imageStyleDimensionPattern],
      width: [imageStyleDimensionPattern],
    },
    span: {
      'font-size': [/^(?:12|14|16|18|20|24|32|48)px$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  allowProtocolRelative: false,
  transformTags: {
    a(tagName: string, attribs: HtmlAttributes) {
      return { tagName, attribs: sanitizeLinkAttributes(attribs) };
    },
    img(tagName: string, attribs: HtmlAttributes) {
      return { tagName, attribs: sanitizeImageAttributes(attribs) };
    },
  },
};

export function sanitizeRichTextHtml(value: string) {
  return sanitizeHtml(value, richTextSanitizeOptions);
}
