/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// Safe Base64 encoding for UTF-8 strings
export function safeBase64Encode(str: string): string {
  try {
    return window.btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }),
    );
  } catch (e) {
    console.error('Base64 encoding failed:', e);
    return '';
  }
}

export function encodeUrlForKKFileView(url: string): string {
  if (!url) return '';
  // If URL is standard ASCII (Percent-Encoded), use pure btoa to avoid double encoding issues
  // Checking if URL contains only ASCII characters (codes 0-127)
  const isAsciiOnly = [...url].every((char) => char.charCodeAt(0) < 128);
  if (isAsciiOnly) {
    return encodeURIComponent(window.btoa(url));
  }
  // Fallback for non-standard URLs (e.g. unencoded Chinese)
  const base64Encoded = safeBase64Encode(url);
  return encodeURIComponent(base64Encoded);
}

export function getAbsoluteFileUrl(file: any): string {
  if (!file?.url) return '';
  try {
    // Use URL API to ensure proper encoding (e.g. Chinese characters -> Percent-Encoded)
    const baseUrl =
      file.url.startsWith('https://') || file.url.startsWith('http://')
        ? file.url
        : new URL(file.url, window.location.origin).href;

    // Re-verify it is a valid URL object and return href
    return new URL(baseUrl).href;
  } catch (e) {
    // Fallback to simple concatenation if URL parsing fails
    if (file.url.startsWith('https://') || file.url.startsWith('http://')) {
      return file.url;
    }
    return `${window.location.origin}${file.url.startsWith('/') ? '' : '/'}${file.url}`;
  }
}

export function isMixedContent(contentUrl: string): boolean {
  if (window.location.protocol === 'https:') {
    try {
      const url = new URL(contentUrl);
      if (url.protocol === 'http:') {
        return true;
      }
    } catch (e) {
      // If invalid URL, assume safe or let it fail later
    }
  }
  return false;
}

export function isPrivateNetwork(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    !!hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
    hostname.endsWith('.local')
  );
}

// Allowed extensions for Microsoft Office Online
const OFFICE_EXTENSIONS = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'];

// Default safe list for KKFileView if no extensions are configured
// Includes Office, Text, Code, Archives
export const KKFILEVIEW_DEFAULT_EXTENSIONS = [
  ...OFFICE_EXTENSIONS,
  'pdf',
  'txt',
  'md',
  'xml',
  'json',
  'java',
  'py',
  'js',
  'css',
  'html',
  'zip',
  'rar',
  'tar',
  'gz',
  '7z',
  'dwg',
  'autocad',
];

export function isOfficeFile(file: any): boolean {
  if (file.mimetype) {
    if (
      [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint',
      ].includes(file.mimetype)
    ) {
      return true;
    }
  }
  if (file.extname) {
    const ext = file.extname.replace(/^\./, '').toLowerCase();
    return OFFICE_EXTENSIONS.includes(ext);
  }
  return false;
}

export function isImageOrPdf(file: any): boolean {
  if (file.mimetype) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      return true;
    }
  }
  if (file.extname) {
    const ext = file.extname.replace(/^\./, '').toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'pdf'].includes(ext);
  }
  return false;
}
