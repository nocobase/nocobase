/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface FilePreviewerConfig {
  id?: string;
  previewType: 'microsoft' | 'kkfileview' | 'basemetas';
  kkFileViewUrl?: string;
  /** @deprecated use customExtensions instead */
  kkFileViewExtensions?: string;
  customExtensions?: string;
  basemetasUrl?: string;
}

// ---- Config cache (module-level, shared between v1 and v2) ----

const DEFAULT_CONFIG: FilePreviewerConfig = {
  previewType: 'microsoft',
  kkFileViewUrl: 'http://localhost:8012',
  basemetasUrl: 'http://localhost:9000',
};

let cachedConfig: FilePreviewerConfig | null = null;

export const getCachedConfig = (): FilePreviewerConfig => {
  return cachedConfig || DEFAULT_CONFIG;
};

export const setCachedConfig = (config: FilePreviewerConfig | null) => {
  cachedConfig = config;
};

/**
 * Minimal shape of a previewable file. Accepts the file-manager attachment record
 * or a bare URL string. All fields are optional so the helpers stay tolerant
 * of partial records coming from different call sites.
 */
export interface OfficePreviewFileObject {
  url?: string;
  mimetype?: string;
  extname?: string;
  name?: string;
  filename?: string;
  title?: string;
  size?: number;
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

export const KKFILEVIEW_DEFAULT_EXTENSIONS = [
  ...OFFICE_EXTS,
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

export const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];

// ---- Base office helpers (aligned with OSS plugin) ----

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

// ---- Pro-specific helpers ----

export const isImageOrPdf = (file: OfficePreviewFile): boolean => {
  if (file && typeof file === 'object' && file.mimetype) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      return true;
    }
  }
  const ext = getOfficeFileExt(file);
  return !!ext && [...IMAGE_EXTS, 'pdf'].includes(ext);
};

export const isPrivateNetwork = (hostname: string): boolean => {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    !!hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
    hostname.endsWith('.local')
  );
};

export const safeBase64Encode = (str: string): string => {
  try {
    return window.btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) => String.fromCharCode(parseInt(p1, 16))),
    );
  } catch (e) {
    console.error('Base64 encoding failed:', e);
    return '';
  }
};

export const getFileNameWithExt = (file: OfficePreviewFile): string => {
  if (typeof file === 'string') {
    return file.split('/').pop() || '';
  }
  let filename = file?.title || file?.filename || file?.name || '';
  if (file?.extname && !filename.toLowerCase().endsWith(file.extname.toLowerCase())) {
    filename = `${filename}${file.extname}`;
  }
  return filename;
};

export const encodeUrlForKKFileView = (url: string): string => {
  if (!url) return '';
  const isAsciiOnly = [...url].every((char) => char.charCodeAt(0) < 128);
  if (isAsciiOnly) {
    return encodeURIComponent(window.btoa(url));
  }
  const base64Encoded = safeBase64Encode(url);
  return encodeURIComponent(base64Encoded);
};

export const getAbsoluteFileUrl = (file: OfficePreviewFile): string => {
  const url = typeof file === 'string' ? file : file?.url;
  if (!url) return '';

  try {
    const baseUrl =
      url.startsWith('https://') || url.startsWith('http://') ? url : new URL(url, window.location.origin).href;
    return new URL(baseUrl).href;
  } catch (e) {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      return url;
    }
    return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
};

export const isMixedContent = (contentUrl: string): boolean => {
  if (window.location.protocol === 'https:') {
    try {
      const url = new URL(contentUrl);
      if (url.protocol === 'http:') {
        return true;
      }
    } catch (e) {
      // invalid URL
    }
  }
  return false;
};

export interface PreviewWarning {
  messageKey: string;
  descriptionKey?: string;
  type: 'warning' | 'error';
}

export interface PreviewState {
  url: string;
  warnings: PreviewWarning[];
  iframeError: boolean;
}

const MAX_FILE_SIZE = 30 * 1024 * 1024;

/**
 * Core logic to determine preview URL and warnings for a given file and config.
 * Returns i18n keys so callers can translate in their own context.
 */
export const getPreviewState = (file: OfficePreviewFile, config: FilePreviewerConfig | null): PreviewState => {
  if (!file || !config) return { url: '', warnings: [], iframeError: false };

  const warnings: PreviewWarning[] = [];
  let previewUrl = '';
  let hasIframeError = false;

  const fileObj = typeof file === 'string' ? { url: file } : file;

  if (fileObj?.size && fileObj.size > MAX_FILE_SIZE) {
    warnings.push({
      messageKey: 'File too large',
      descriptionKey: 'The file size exceeds 30MB. Please download it for viewing.',
      type: 'warning',
    });
    return { url: '', warnings, iframeError: false };
  }

  const mode = config.previewType;

  if (mode === 'microsoft') {
    if (!isOfficeFile(file)) {
      hasIframeError = true;
      warnings.push({ messageKey: 'File type not supported by Microsoft Preview', type: 'error' });
    } else {
      const fileUrl = getAbsoluteFileUrl(file);
      previewUrl = getOfficePreviewUrl(fileUrl);

      if (isPrivateNetwork(window.location.hostname)) {
        warnings.push({
          messageKey: 'Public access required',
          descriptionKey: 'Microsoft Online Preview requires public network access',
          type: 'warning',
        });
      }
    }
  } else if (mode === 'kkfileview') {
    const kkUrl = config.kkFileViewUrl || 'http://localhost:8012';

    if (isMixedContent(kkUrl)) {
      warnings.push({
        messageKey: 'Mixed Content Warning',
        descriptionKey: 'Your site is HTTPS but KKFileView is HTTP. Preview will fail.',
        type: 'error',
      });
      hasIframeError = true;
    }

    const fileUrl = getAbsoluteFileUrl(file);
    const encodedFileUrl = encodeUrlForKKFileView(fileUrl);
    const filename = getFileNameWithExt(file);
    const encodedFilename = encodeURIComponent(filename);
    previewUrl = `${kkUrl}/onlinePreview?url=${encodedFileUrl}&fullfilename=${encodedFilename}`;
  } else if (mode === 'basemetas') {
    const basemetasUrl = config.basemetasUrl || 'http://localhost:9000';

    if (isMixedContent(basemetasUrl)) {
      warnings.push({
        messageKey: 'Mixed Content Warning',
        descriptionKey: 'Your site is HTTPS but BaseMetas is HTTP. Preview will fail.',
        type: 'error',
      });
      hasIframeError = true;
    }

    const fileUrl = getAbsoluteFileUrl(file);
    const encodedFileUrl = encodeURIComponent(fileUrl);
    const fileName = getFileNameWithExt(file);
    const encodedFileName = encodeURIComponent(fileName);
    const displayName = fileObj?.title || fileName;
    const encodedDisplayName = encodeURIComponent(displayName);
    previewUrl = `${basemetasUrl}/preview/view?url=${encodedFileUrl}&fileName=${encodedFileName}&displayName=${encodedDisplayName}`;
  }

  return { url: previewUrl, warnings, iframeError: hasIframeError };
};

/**
 * Determine whether a file should be previewed by this plugin,
 * based on the configured preview type and extension lists.
 */
export const shouldPreviewFile = (file: OfficePreviewFile, config: FilePreviewerConfig | null): boolean => {
  if (!config) return isOfficeFile(file);

  const extensions = config.customExtensions || config.kkFileViewExtensions;

  // Priority 1: Custom Extensions (Explicit User Override)
  if (extensions) {
    const ext = getOfficeFileExt(file);
    const allowed = extensions
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (allowed.includes(ext)) return true;
  }

  // Priority 2: Exclude standard Images and PDFs (handled by other previewers)
  if (isImageOrPdf(file)) {
    return false;
  }

  // Priority 3: Default logic based on preview mode
  if (config.previewType === 'kkfileview' || config.previewType === 'basemetas') {
    if (!extensions) {
      const ext = getOfficeFileExt(file);
      if (KKFILEVIEW_DEFAULT_EXTENSIONS.includes(ext)) {
        return true;
      }
    }
    return false;
  }

  // Priority 4: Microsoft Mode default
  return isOfficeFile(file);
};
