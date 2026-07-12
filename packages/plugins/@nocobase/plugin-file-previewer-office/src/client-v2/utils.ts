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
  id?: string | number;
  storageId?: string | number;
  url?: string;
  mimetype?: string;
  extname?: string;
  name?: string;
  filename?: string;
  title?: string;
}

export type OfficePreviewFile = string | OfficePreviewFileObject | null | undefined;

export interface FileCollectionReference {
  dataSourceKey: string;
  collectionName: string;
}

export interface PermanentFileAccessParams extends FileCollectionReference {
  appName: string;
  id: string;
}

export interface OfficePreviewAPIClient {
  request<T>(config: { url: string; method: 'post'; headers: Record<string, string> }): Promise<{ data: T }>;
}

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
  const segments = value.split('?')[0].split('#')[0].split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || value;
  let decodedSegment = lastSegment;
  try {
    decodedSegment = decodeURIComponent(lastSegment);
  } catch {
    // Keep the original segment when the URL contains malformed escaping.
  }
  const index = decodedSegment.lastIndexOf('.');
  return index !== -1 ? decodedSegment.slice(index + 1).toLowerCase() : '';
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

const IDENTIFIER_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/;

export const parsePermanentFileUrl = (file: OfficePreviewFile): PermanentFileAccessParams | null => {
  const value = typeof file === 'string' ? file : file?.url;
  if (!value) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(value, location.origin);
  } catch {
    return null;
  }
  if (url.origin !== location.origin) {
    return null;
  }
  if (url.searchParams.has('temporary-access-token')) {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  const filesIndex = segments.length - 5;
  if (filesIndex < 0 || segments[filesIndex] !== 'files') {
    return null;
  }
  const fileSegments = segments.slice(filesIndex + 1);
  if (fileSegments.length !== 4) {
    return null;
  }

  try {
    const [appName, dataSourceKey, collectionName, fileIdSegment] = fileSegments.map(decodeURIComponent);
    if (
      !IDENTIFIER_PATTERN.test(appName) ||
      !IDENTIFIER_PATTERN.test(dataSourceKey) ||
      !IDENTIFIER_PATTERN.test(collectionName)
    ) {
      return null;
    }
    const extnameIndex = fileIdSegment.lastIndexOf('.');
    const id = extnameIndex > 0 ? fileIdSegment.slice(0, extnameIndex) : fileIdSegment;
    return { appName, dataSourceKey, collectionName, id };
  } catch {
    return null;
  }
};

export const resolveTemporaryOfficeFileUrl = async (
  apiClient: OfficePreviewAPIClient,
  file: OfficePreviewFile,
  fileCollection?: FileCollectionReference,
): Promise<string> => {
  let accessParams: Pick<PermanentFileAccessParams, 'dataSourceKey' | 'collectionName' | 'id'>;
  let headers: Record<string, string>;

  if (fileCollection && file && typeof file === 'object' && file.id != null && file.storageId != null) {
    accessParams = {
      dataSourceKey: fileCollection.dataSourceKey,
      collectionName: fileCollection.collectionName,
      id: String(file.id),
    };
    headers = { 'X-Data-Source': accessParams.dataSourceKey };
  } else {
    accessParams = parsePermanentFileUrl(file);
    if (!accessParams || (fileCollection && accessParams.collectionName !== fileCollection.collectionName)) {
      return resolveFileUrl(file);
    }
    headers = {
      'X-App': accessParams.appName,
      'X-Data-Source': accessParams.dataSourceKey,
    };
  }

  const response = await apiClient.request<{ data?: { url?: string }; url?: string }>({
    url: `${encodeURIComponent(accessParams.collectionName)}:createTemporaryURL/${encodeURIComponent(accessParams.id)}`,
    method: 'post',
    headers,
  });
  const temporaryUrl = response.data?.data?.url || response.data?.url;
  if (!temporaryUrl) {
    throw new Error('Temporary file URL is missing');
  }
  return new URL(temporaryUrl, location.origin).href;
};

export const isOfficeFile = (file: OfficePreviewFile): boolean => {
  if (file && typeof file === 'object' && file.mimetype && OFFICE_MIME_TYPES.includes(file.mimetype)) {
    return true;
  }
  const ext = getOfficeFileExt(file);
  return !!ext && OFFICE_EXTS.includes(ext);
};
