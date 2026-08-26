/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * Minimal shape of a previewable file. Accepts the file-manager attachment record
 * (a superset of these fields) or a bare URL string. All fields are optional so
 * the helpers stay tolerant of partial records coming from different call sites.
 */
export interface OfficePreviewFileObject {
  url?: string;
  mimetype?: string;
  extname?: string;
  name?: string;
  filename?: string;
  title?: string;
}

export type OfficePreviewFile = string | OfficePreviewFileObject | null | undefined;

export const OFFICE_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.oasis.opendocument.text',
];

export const OFFICE_EXTS = ['docx', 'xlsx', 'pptx', 'odt', 'doc', 'xls', 'ppt'];

export const getOfficeFileExt = (file: OfficePreviewFile): string => {
  const value = typeof file === 'string' ? file : file?.extname || file?.name || file?.filename || file?.url || '';
  const clean = value.split('?')[0].split('#')[0];
  const index = clean.lastIndexOf('.');
  return index !== -1 ? clean.slice(index + 1).toLowerCase() : '';
};

export const resolveFileUrl = (file: OfficePreviewFile): string => {
  const url = typeof file === 'string' ? file : file?.url;
  if (!url) {
    return '';
  }
  return url.startsWith('https://') || url.startsWith('http://') ? url : `${location.origin}/${url.replace(/^\//, '')}`;
};

export const getOfficePreviewUrl = (file: OfficePreviewFile): string => {
  const src = resolveFileUrl(file);
  if (!src) {
    return '';
  }
  const url = new URL('https://view.officeapps.live.com/op/embed.aspx');
  url.searchParams.set('src', src);
  return url.href;
};

export const isOfficeFile = (file: OfficePreviewFile): boolean => {
  if (file && typeof file === 'object' && file.mimetype && OFFICE_MIME_TYPES.includes(file.mimetype)) {
    return true;
  }
  const ext = getOfficeFileExt(file);
  return !!ext && OFFICE_EXTS.includes(ext);
};
