/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons';
import { css } from '@emotion/css';
import { Alert, Image, Modal, Space, Spin } from 'antd';
import match from 'mime-match';
import { Trans, useTranslation } from 'react-i18next';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFWorker, RenderTask } from 'pdfjs-dist';
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import { NAMESPACE } from '../../common/constants';

type NocoBaseWindow = Window & {
  __nocobase_api_base_url__?: string;
  __nocobase_modern_client_prefix__?: string;
  __nocobase_public_path__?: string;
  __webpack_public_path__?: string;
};

const FILE_ACCESS_SEGMENT = 'files';
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_-]*$/;
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+.-]*:/i;
const PROTOCOL_RELATIVE_URL_PATTERN = /^\/\//;

const withPublicPath = (path: string) => {
  const browserWindow = typeof window === 'undefined' ? undefined : (window as NocoBaseWindow);
  const assetPublicPath = browserWindow?.__webpack_public_path__;
  const appPublicPath = browserWindow?.__nocobase_public_path__;
  const publicPath =
    assetPublicPath && assetPublicPath !== '/' ? assetPublicPath : appPublicPath || assetPublicPath || '/';
  return `${publicPath.replace(/\/+$/g, '')}/${path.replace(/^\//, '')}`;
};

export interface FileCollectionReference {
  dataSourceKey: string;
  collectionName: string;
}

export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
  fileCollection?: FileCollectionReference;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSwitchIndex?: (index: number) => void;
  onClose?: () => void;
  onDownload: (file: any) => void;
}

export interface FilePreviewType {
  match(file: any): boolean;
  getThumbnailURL?: (file: any) => string | null;
  Previewer?: React.ComponentType<FilePreviewerProps>;
}

export class FilePreviewTypes {
  types: FilePreviewType[] = [];
  add(type: FilePreviewType) {
    // NOTE: use unshift to make sure the custom type has higher priority
    this.types.unshift(type);
  }
  getTypeByFile(file: any): Omit<FilePreviewType, 'match'> | undefined {
    const normalized = normalizePreviewFile(file);
    return this.types.find((type) => type.match(normalized));
  }
}

export const filePreviewTypes = new FilePreviewTypes();

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const getResponseFileRecord = (response: unknown) => {
  if (!isPlainObject(response)) {
    return null;
  }

  const candidate = isPlainObject(response.data) ? response.data : response;
  return ['id', 'url', 'preview', 'filename', 'extname', 'mimetype'].some((key) => key in candidate) ? candidate : null;
};

export function normalizePreviewFile(file: any) {
  if (!file) {
    return file;
  }
  if (typeof file === 'string') {
    return { url: file };
  }
  const responseRecord = getResponseFileRecord(file.response);
  if (responseRecord) {
    const normalized = {
      ...file,
      ...responseRecord,
      response: file.response,
      originFileObj: file.originFileObj,
    };
    if (!normalized.name && typeof responseRecord.filename === 'string') {
      normalized.name = responseRecord.filename;
    }
    if (!normalized.type && typeof responseRecord.mimetype === 'string') {
      normalized.type = responseRecord.mimetype;
    }
    return normalized;
  }
  return file;
}

const localPreviewUrlByFile = new WeakMap<object, string>();
const localPreviewUrlByRecordKey = new Map<string, string>();

const getOriginFileObject = (file: any) => {
  if (file?.originFileObj) {
    return file.originFileObj;
  }
  if (typeof Blob !== 'undefined' && file instanceof Blob) {
    return file;
  }
  return null;
};

const getUrlRecordKeys = (type: string, value?: string) => {
  if (!value) {
    return [];
  }
  const keys = [`${type}:${value}`];
  if (typeof location !== 'undefined') {
    try {
      const url = new URL(value, location.origin);
      keys.push(`${type}:${url.toString()}`);
      if (url.origin === location.origin) {
        keys.push(`${type}:${url.pathname}${url.search}${url.hash}`);
      }
    } catch (error) {
      // Keep the original key for non-standard URL values.
    }
  }
  return [...new Set(keys)];
};

const getLocalPreviewRecordKeys = (file: any) => {
  if (!file || typeof file !== 'object') {
    return [];
  }

  return [
    ...getUrlRecordKeys('url', file.url),
    ...getUrlRecordKeys('preview', file.preview),
    file.id != null ? `id:${String(file.id)}` : '',
  ].filter(Boolean);
};

export function getLocalPreviewUrl(file: any) {
  if (!file || !matchMimetype(file, 'image/*') || typeof URL === 'undefined') {
    return '';
  }

  const originFileObj = getOriginFileObject(file);
  if (originFileObj) {
    const cachedUrl = localPreviewUrlByFile.get(originFileObj);
    if (cachedUrl) {
      return cachedUrl;
    }
    if (typeof URL.createObjectURL === 'function') {
      const url = URL.createObjectURL(originFileObj as Blob);
      localPreviewUrlByFile.set(originFileObj, url);
      return url;
    }
  }

  for (const key of getLocalPreviewRecordKeys(file)) {
    const url = localPreviewUrlByRecordKey.get(key);
    if (url) {
      return url;
    }
  }

  return '';
}

export function rememberLocalPreviewUrl(file: any, sourceFile: any) {
  const url = getLocalPreviewUrl(sourceFile);
  if (!url) {
    return;
  }

  getLocalPreviewRecordKeys(file).forEach((key) => {
    localPreviewUrlByRecordKey.set(key, url);
  });
}

export function revokeLocalPreviewUrl(file: any) {
  const urls = new Set<string>();
  const originFileObj = getOriginFileObject(file);
  if (originFileObj) {
    const url = localPreviewUrlByFile.get(originFileObj);
    if (url) {
      urls.add(url);
      localPreviewUrlByFile.delete(originFileObj);
    }
  }

  getLocalPreviewRecordKeys(file).forEach((key) => {
    const url = localPreviewUrlByRecordKey.get(key);
    if (url) {
      urls.add(url);
      localPreviewUrlByRecordKey.delete(key);
    }
  });

  if (!urls.size) {
    return;
  }

  for (const [key, value] of localPreviewUrlByRecordKey.entries()) {
    if (urls.has(value)) {
      localPreviewUrlByRecordKey.delete(key);
    }
  }

  if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    urls.forEach((url) => URL.revokeObjectURL(url));
  }
}

export function revokeLocalPreviewUrls(files: any[] = []) {
  files.forEach((file) => revokeLocalPreviewUrl(file));
}

export function getPreviewFileUrl(file: any) {
  if (!file) {
    return '';
  }
  if (typeof file === 'string') {
    return file;
  }
  const localPreviewUrl = getLocalPreviewUrl(file);
  if (localPreviewUrl) {
    return localPreviewUrl;
  }
  return file.preview || file.url || '';
}

export function getFileUrl(file: any) {
  if (!file) {
    return '';
  }
  if (typeof file === 'string') {
    return file;
  }
  return file.url || file.preview || '';
}

const FALLBACK_ICON_MAP: Record<string, string> = {
  pdf: '/file-placeholder/pdf-200-200.png',
  mp4: '/file-placeholder/video-200-200.png',
  mov: '/file-placeholder/video-200-200.png',
  avi: '/file-placeholder/video-200-200.png',
  wmv: '/file-placeholder/video-200-200.png',
  flv: '/file-placeholder/video-200-200.png',
  mkv: '/file-placeholder/video-200-200.png',
  mp3: '/file-placeholder/audio-200-200.png',
  wav: '/file-placeholder/audio-200-200.png',
  aac: '/file-placeholder/audio-200-200.png',
  ogg: '/file-placeholder/audio-200-200.png',
  doc: '/file-placeholder/docx-200-200.png',
  docx: '/file-placeholder/docx-200-200.png',
  odt: '/file-placeholder/docx-200-200.png',
  xls: '/file-placeholder/xlsx-200-200.png',
  xlsx: '/file-placeholder/xlsx-200-200.png',
  csv: '/file-placeholder/xlsx-200-200.png',
  ppt: '/file-placeholder/pptx-200-200.png',
  pptx: '/file-placeholder/pptx-200-200.png',
  jpg: '/file-placeholder/jpeg-200-200.png',
  jpeg: '/file-placeholder/jpeg-200-200.png',
  png: '/file-placeholder/png-200-200.png',
  gif: '/file-placeholder/gif-200-200.png',
  webp: '/file-placeholder/png-200-200.png',
  bmp: '/file-placeholder/png-200-200.png',
  svg: '/file-placeholder/svg-200-200.png',
  default: '/file-placeholder/unknown-200-200.png',
};

const ACTIVE_CONTENT_MIMETYPES = new Set(['application/pdf', 'application/xhtml+xml', 'image/svg+xml', 'text/html']);
const ACTIVE_CONTENT_EXTENSIONS = new Set(['htm', 'html', 'pdf', 'svg', 'svgz', 'xhtml']);

const stripQueryAndHash = (url: string) => url.split('?')[0].split('#')[0];

const getExtFromName = (value?: string) => {
  if (!value) {
    return '';
  }
  const clean = stripQueryAndHash(value);
  const index = clean.lastIndexOf('.');
  return index !== -1 ? clean.slice(index + 1).toLowerCase() : '';
};

const EXT_MIMETYPE_MAP: Record<string, string> = {
  aac: 'audio/aac',
  avi: 'video/x-msvideo',
  bmp: 'image/bmp',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  flv: 'video/x-flv',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  json: 'application/json',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  odt: 'application/vnd.oasis.opendocument.text',
  ogg: 'audio/ogg',
  pdf: 'application/pdf',
  png: 'image/png',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  wav: 'audio/wav',
  webp: 'image/webp',
  wmv: 'video/x-ms-wmv',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function matchMimetype(file: any, type: string) {
  if (!file) {
    return false;
  }
  if (file.originFileObj) {
    return match(file.type || file.originFileObj.type || '', type);
  }
  if (file.mimetype) {
    return match(file.mimetype, type);
  }
  return match(EXT_MIMETYPE_MAP[getFileExt(file, getFileUrl(file))] || '', type);
}

const getNameFromUrl = (url?: string) => {
  if (!url) {
    return '';
  }
  const clean = stripQueryAndHash(url);
  const index = clean.lastIndexOf('/');
  const name = index !== -1 ? clean.slice(index + 1) : clean;
  try {
    return decodeURIComponent(name);
  } catch (error) {
    return name;
  }
};

export const getFileExt = (file: any, url?: string) => {
  if (file && typeof file === 'object') {
    if (file.extname) {
      return String(file.extname).replace(/^\./, '').toLowerCase();
    }
    const nameExt = getExtFromName(file.name || file.filename || file.title);
    if (nameExt) {
      return nameExt;
    }
  }
  return getExtFromName(url);
};

export const isActiveContentFile = (file: any, url?: string) => {
  const mimetype = file?.mimetype || file?.type;
  if (typeof mimetype === 'string' && ACTIVE_CONTENT_MIMETYPES.has(mimetype.toLowerCase())) {
    return true;
  }

  const ext = getFileExt(file, url);
  return ACTIVE_CONTENT_EXTENSIONS.has(ext);
};

export const isPdfFile = (file: any, url?: string) => {
  const mimetype = file?.mimetype || file?.type;
  if (typeof mimetype === 'string' && mimetype.toLowerCase() === 'application/pdf') {
    return true;
  }
  return getFileExt(file, url) === 'pdf';
};

export const isSameOriginUrl = (url?: string) => {
  if (!url || typeof window === 'undefined') {
    return true;
  }

  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch (error) {
    return true;
  }
};

const isRelativeUrlInput = (value?: string) => {
  return !!value && !ABSOLUTE_URL_PATTERN.test(value) && !PROTOCOL_RELATIVE_URL_PATTERN.test(value);
};

const getBrowserWindow = () => (typeof window === 'undefined' ? undefined : (window as NocoBaseWindow));

const getCurrentOrigin = () => {
  const browserWindow = getBrowserWindow();
  return browserWindow?.location?.origin;
};

const getTrustedApiOrigin = () => {
  const browserWindow = getBrowserWindow();
  const apiBaseURL = browserWindow?.__nocobase_api_base_url__;
  if (!apiBaseURL) {
    return undefined;
  }
  try {
    return new URL(apiBaseURL, browserWindow.location.href).origin;
  } catch (error) {
    return undefined;
  }
};

const getPublicPathname = () => {
  const browserWindow = getBrowserWindow();
  const href = browserWindow?.location?.href || 'http://localhost/';
  return new URL(browserWindow?.__nocobase_public_path__ || '/', href).pathname.replace(/\/+$/g, '');
};

const stripPublicPath = (pathname: string) => {
  const publicPath = getPublicPathname();
  if (publicPath && publicPath !== '/' && (pathname === publicPath || pathname.startsWith(`${publicPath}/`))) {
    return pathname.slice(publicPath.length) || '/';
  }
  return pathname;
};

const hasTrustedFileUrlOrigin = (url: URL, source?: string) => {
  if (isRelativeUrlInput(source)) {
    return true;
  }
  const currentOrigin = getCurrentOrigin();
  const trustedApiOrigin = getTrustedApiOrigin();
  return (!!currentOrigin && url.origin === currentOrigin) || (!!trustedApiOrigin && url.origin === trustedApiOrigin);
};

const isIdentifierSegment = (segment: string) => {
  try {
    return IDENTIFIER_PATTERN.test(decodeURIComponent(segment));
  } catch (error) {
    return false;
  }
};

const hasPermanentFilePath = (pathname: string) => {
  const segments = stripPublicPath(pathname).split('/').filter(Boolean);
  return (
    segments.length === 5 &&
    segments[0] === FILE_ACCESS_SEGMENT &&
    isIdentifierSegment(segments[1]) &&
    isIdentifierSegment(segments[2]) &&
    isIdentifierSegment(segments[3]) &&
    !!segments[4]
  );
};

export const isPermanentFileUrl = (value: string | URL) => {
  const source = typeof value === 'string' ? value : undefined;
  const href = getBrowserWindow()?.location?.href || 'http://localhost/';
  try {
    const url = value instanceof URL ? value : new URL(value, href);
    return hasTrustedFileUrlOrigin(url, source) && hasPermanentFilePath(url.pathname);
  } catch (error) {
    return false;
  }
};

const formatUrlLikeInput = (url: URL, source: string) => {
  if (!isRelativeUrlInput(source)) {
    return url.toString();
  }
  return `${url.pathname}${url.search}${url.hash}`;
};

export const getPermanentFilePreviewUrl = (value?: string) => {
  if (!value || typeof window === 'undefined') {
    return '';
  }
  try {
    const url = new URL(value, window.location.href);
    if (!isPermanentFileUrl(value) || url.searchParams.has('temporaryAccessToken')) {
      return '';
    }
    url.searchParams.set('preview', '1');
    return formatUrlLikeInput(url, value);
  } catch (error) {
    return '';
  }
};

export const getFileFetchCredentials = (url: string | URL): RequestCredentials => {
  if (typeof window === 'undefined') {
    return 'same-origin';
  }

  try {
    const target = url instanceof URL ? url : new URL(url, window.location.href);
    if (target.origin === window.location.origin) {
      return 'include';
    }
    if (isPermanentFileUrl(target)) {
      return 'include';
    }
  } catch (error) {
    return 'same-origin';
  }

  return 'same-origin';
};

export const triggerFileDownload = (url: string, filename: string) => {
  let downloadUrl = url;
  try {
    const target = new URL(url, window.location.href);
    if (isPermanentFileUrl(url)) {
      target.searchParams.set('download', '1');
      downloadUrl = /^[a-z][a-z\d+.-]*:/i.test(url)
        ? target.toString()
        : `${target.pathname}${target.search}${target.hash}`;
    }
  } catch (error) {
    downloadUrl = url;
  }
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const getLocalStorageFlag = (file: any) => {
  if (!file || typeof file === 'string') {
    return undefined;
  }
  const normalized = normalizePreviewFile(file);
  const local = normalized.local ?? normalized.response?.local ?? normalized.response?.data?.local;
  return typeof local === 'boolean' ? local : undefined;
};

export const shouldUsePdfJsPreview = (file: any, src = getFileUrl(file)) => {
  if (!src || !isSameOriginUrl(src)) {
    return false;
  }
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    const url = new URL(src, window.location.href);
    if (!isPermanentFileUrl(url)) {
      return true;
    }
    return getLocalStorageFlag(file) !== false;
  } catch (error) {
    return true;
  }
};

export const getFileName = (file: any, url?: string) => {
  const nameFromUrl = getNameFromUrl(url || getFileUrl(file));
  if (!file || typeof file === 'string') {
    return nameFromUrl;
  }
  return file.name || file.filename || file.title || nameFromUrl;
};

export const getDownloadFileName = (file: any, url?: string) => {
  const resolvedUrl = url || getFileUrl(file);
  let filename = getFileName(file, resolvedUrl);
  const ext = getFileExt(file, resolvedUrl);

  if (filename && ext && !filename.toLowerCase().endsWith(`.${ext}`)) {
    filename = `${filename}.${ext}`;
  }

  return `${Date.now()}_${filename || 'file'}`;
};

export const getFallbackIcon = (file: any, url?: string) => {
  const ext = getFileExt(file, url);
  return withPublicPath(FALLBACK_ICON_MAP[ext] || FALLBACK_ICON_MAP.default);
};

export const getPreviewThumbnailUrl = (file: any) => {
  const previewFile = normalizePreviewFile(file);
  const src = getPreviewFileUrl(previewFile);
  if (isActiveContentFile(previewFile, src)) {
    return getFallbackIcon(previewFile, src);
  }
  const { getThumbnailURL } = filePreviewTypes.getTypeByFile(previewFile) ?? {};
  const thumbnail = getThumbnailURL?.(previewFile);
  if (thumbnail) {
    return thumbnail;
  }
  if (matchMimetype(previewFile, 'image/*')) {
    return getPermanentFilePreviewUrl(src);
  }
  return getFallbackIcon(previewFile, src);
};

const renderModalFooter = (props: FilePreviewerProps) => {
  const { index, list, onSwitchIndex, onDownload, file } = props;
  const canPrev = typeof index === 'number' && !!onSwitchIndex && index > 0;
  const canNext = typeof index === 'number' && !!onSwitchIndex && index < list.length - 1;
  return (
    <Space size={14} style={{ fontSize: '20px' }}>
      <LeftOutlined
        style={{ cursor: canPrev ? 'pointer' : 'not-allowed' }}
        disabled={!canPrev}
        onClick={() => canPrev && onSwitchIndex?.(index - 1)}
      />
      <RightOutlined
        style={{ cursor: canNext ? 'pointer' : 'not-allowed' }}
        disabled={!canNext}
        onClick={() => canNext && onSwitchIndex?.(index + 1)}
      />
      <DownloadOutlined onClick={() => onDownload(file)} />
    </Space>
  );
};

export const wrapWithModalPreviewer = (Previewer: React.ComponentType<FilePreviewerProps>) => {
  return function WrappedPreviewer(props: FilePreviewerProps) {
    const { open, onOpenChange, onClose, file } = props;
    if (typeof open !== 'boolean') {
      return <Previewer {...props} />;
    }
    const title = getFileName(file, getFileUrl(file));
    return (
      <Modal
        open={open}
        title={title}
        onCancel={() => {
          onOpenChange?.(false);
          onClose?.();
        }}
        footer={renderModalFooter(props)}
        width="90vw"
        centered={true}
      >
        <div
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 256px)',
            height: '80vh',
            width: '100%',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflowY: 'auto',
          }}
        >
          <Previewer {...props} />
        </div>
      </Modal>
    );
  };
};

const ImagePreviewer = (props: FilePreviewerProps) => {
  const { file, list, index, open, onOpenChange, onSwitchIndex, onClose, onDownload } = props;
  if (typeof open !== 'boolean') {
    return null;
  }
  const src = getPreviewFileUrl(file);
  if (!src) {
    return null;
  }
  const canPrev = typeof index === 'number' && index > 0;
  const canNext = typeof index === 'number' && index < list.length - 1;
  return (
    <Image
      wrapperStyle={{ display: 'none' }}
      preview={{
        visible: open,
        onVisibleChange: (visible) => onOpenChange?.(visible),
        afterOpenChange: (visible) => {
          if (!visible) {
            onClose?.();
          }
        },
        toolbarRender: (
          _,
          {
            transform: { scale },
            actions: { onFlipY, onFlipX, onRotateLeft, onRotateRight, onZoomOut, onZoomIn, onReset },
          },
        ) => (
          <Space size={14} className="toolbar-wrapper" style={{ fontSize: '20px' }}>
            <LeftOutlined
              style={{ cursor: canPrev ? 'pointer' : 'not-allowed' }}
              disabled={!canPrev}
              onClick={() => canPrev && onSwitchIndex?.(index - 1)}
            />
            <RightOutlined
              style={{ cursor: canNext ? 'pointer' : 'not-allowed' }}
              disabled={!canNext}
              onClick={() => canNext && onSwitchIndex?.(index + 1)}
            />
            {onDownload ? <DownloadOutlined onClick={() => onDownload(file)} /> : null}
            <SwapOutlined rotate={90} onClick={onFlipY} />
            <SwapOutlined onClick={onFlipX} />
            <RotateLeftOutlined onClick={onRotateLeft} />
            <RotateRightOutlined onClick={onRotateRight} />
            <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
            <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
            <UndoOutlined onClick={onReset} />
          </Space>
        ),
      }}
      src={src}
    />
  );
};

const IframePreviewer = ({ file }: FilePreviewerProps) => {
  const src = getFileUrl(file);
  if (!src) {
    return null;
  }
  return <iframe src={src} width="100%" height="100%" style={{ border: 'none' }} />;
};

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
type PdfTextLayer = InstanceType<PdfJs['TextLayer']>;

let pdfjsPromise: Promise<PdfJs> | null = null;

const ensureTrailingSlash = (path: string) => (path.endsWith('/') ? path : `${path}/`);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getPluginStaticPublicPath = (browserWindow?: NocoBaseWindow) => {
  const webpackPublicPath = browserWindow?.__webpack_public_path__;
  if (webpackPublicPath) {
    return ensureTrailingSlash(webpackPublicPath);
  }

  const publicPath = ensureTrailingSlash(browserWindow?.__nocobase_public_path__ || '/');
  const modernClientPrefix =
    typeof browserWindow?.__nocobase_modern_client_prefix__ === 'string'
      ? browserWindow.__nocobase_modern_client_prefix__.replace(/^\/+|\/+$/g, '')
      : '';
  if (!modernClientPrefix) {
    return publicPath;
  }

  return publicPath.replace(new RegExp(`/${escapeRegExp(modernClientPrefix)}/$`), '/');
};

const getPdfjsBaseUrl = () => {
  const browserWindow = typeof window === 'undefined' ? undefined : (window as NocoBaseWindow);
  const publicPath = getPluginStaticPublicPath(browserWindow);
  return `${publicPath}static/plugins/@nocobase/plugin-file-manager/dist/client/pdfjs/`;
};

export const getPdfPreviewResourceOptions = (): Pick<
  DocumentInitParameters,
  'cMapPacked' | 'cMapUrl' | 'standardFontDataUrl'
> => {
  const pdfjsBaseUrl = getPdfjsBaseUrl();
  return {
    cMapPacked: true,
    cMapUrl: `${pdfjsBaseUrl}cmaps/`,
    standardFontDataUrl: `${pdfjsBaseUrl}standard_fonts/`,
  };
};

export const getPdfPreviewApiSrc = () => `${getPdfjsBaseUrl()}pdf.min.mjs`;

export const getPdfPreviewWorkerSrc = () => `${getPdfjsBaseUrl()}pdf.worker.min.mjs`;

type PdfPreviewErrorCode = 'resources' | 'file' | 'document';

class PdfPreviewError extends Error {
  code: PdfPreviewErrorCode;
  cause?: unknown;

  constructor(code: PdfPreviewErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'PdfPreviewError';
    this.code = code;
    this.cause = cause;
  }
}

export const getPdfPreviewErrorCode = (error: unknown): PdfPreviewErrorCode => {
  if (error instanceof PdfPreviewError) {
    return error.code;
  }
  return 'document';
};

const loadPdfJs = async () => {
  if (!pdfjsPromise) {
    pdfjsPromise = import(/* @vite-ignore */ /* webpackIgnore: true */ getPdfPreviewApiSrc()) as Promise<PdfJs>;
  }
  return pdfjsPromise;
};

const PDF_SCALE = 1.4;

const PDF_PREVIEW_PAGE_CLASS = css`
  position: relative;
  width: 100%;
  background: #fff;
  overflow: hidden;
  --total-scale-factor: calc(${PDF_SCALE} * var(--pdf-responsive-scale, 1));
  --scale-round-x: 1px;
  --scale-round-y: 1px;

  canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }

  .textLayer {
    position: absolute;
    inset: 0;
    overflow: hidden;
    line-height: 1;
    text-align: initial;
    text-size-adjust: none;
    transform-origin: 0 0;
    z-index: 1;
    --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size, 1));
    --min-font-size-inv: calc(1 / var(--min-font-size, 1));
  }

  .textLayer :is(span, br) {
    position: absolute;
    color: transparent;
    white-space: pre;
    cursor: text;
    transform-origin: 0% 0%;
  }

  .textLayer > :not(.markedContent),
  .textLayer .markedContent span:not(.markedContent) {
    z-index: 1;
    --font-height: 0;
    --scale-x: 1;
    --rotate: 0deg;
    font-size: calc(var(--text-scale-factor) * var(--font-height));
    transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
  }

  .textLayer .markedContent {
    display: contents;
  }

  .textLayer span[role='img'] {
    user-select: none;
    cursor: default;
  }

  .textLayer ::selection {
    background: rgba(0, 0, 255, 0.25);
  }
`;

const PDF_PREVIEW_ERROR_MESSAGES: Record<PdfPreviewErrorCode, string> = {
  resources:
    'PDF preview resources failed to load. Please refresh the page and check whether plugin static files are deployed correctly.',
  file: 'PDF preview failed to load the file. If the file is stored on another domain, configure CORS for the external storage to allow this site to read the file.',
  document: 'PDF preview failed. Please download the file to preview it.',
};

interface PdfMeta {
  numPages: number;
  // First page dimensions, used as the placeholder size for every page so the
  // scrollbar reserves a roughly correct full height before pages are rendered.
  width: number;
  height: number;
}

interface PdfSession {
  cancelled: boolean;
  pdfjs?: PdfJs;
  worker?: PDFWorker;
  abortController: AbortController;
  // The full file is fetched once into memory; metadata and page 1 use this
  // document, and every other page gets its own document built from the bytes.
  metaPdf?: PDFDocumentProxy;
  data?: Uint8Array;
  rendered: Set<number>;
  inFlight: Set<number>;
  loadingTasks: PDFDocumentLoadingTask[];
  renderTasks: RenderTask[];
  textLayers: Set<PdfTextLayer>;
  observer?: IntersectionObserver;
}

const PdfPreviewer = ({ file }: FilePreviewerProps) => {
  const { t } = useTranslation(NAMESPACE);
  const src = getFileUrl(file);
  const pageElsRef = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const sessionRef = React.useRef<PdfSession | null>(null);
  const [meta, setMeta] = React.useState<PdfMeta | null>(null);
  const [errorCode, setErrorCode] = React.useState<PdfPreviewErrorCode | null>(null);

  // Load metadata over a streaming document and paint the first page as soon as
  // its bytes arrive. Rendering of the remaining pages happens lazily below.
  React.useEffect(() => {
    if (!src) {
      return;
    }

    const session: PdfSession = {
      cancelled: false,
      abortController: new AbortController(),
      rendered: new Set(),
      inFlight: new Set(),
      loadingTasks: [],
      renderTasks: [],
      textLayers: new Set(),
    };
    sessionRef.current = session;
    setMeta(null);
    setErrorCode(null);

    const init = async () => {
      let pdfjs: PdfJs;
      try {
        pdfjs = await loadPdfJs();
      } catch (error) {
        throw new PdfPreviewError('resources', 'Failed to load PDF.js resources.', error);
      }
      if (session.cancelled) {
        return;
      }
      session.pdfjs = pdfjs;
      // Fetch the whole file once into memory. pdf.js's own URL loader proved
      // unreliable in this app (range/credentials handling), so we control the
      // request here and feed the bytes to in-memory documents below.
      let url: URL;
      try {
        url = new URL(src, location.href);
      } catch (error) {
        throw new PdfPreviewError('file', 'Invalid PDF file URL.', error);
      }
      let response: Response;
      try {
        response = await fetch(url, {
          credentials: getFileFetchCredentials(url),
          signal: session.abortController.signal,
        });
      } catch (error) {
        throw new PdfPreviewError('file', 'Failed to fetch PDF file.', error);
      }
      if (!response.ok) {
        throw new PdfPreviewError('file', `Failed to fetch PDF file: ${response.status}`);
      }
      let data: Uint8Array;
      try {
        data = new Uint8Array(await response.arrayBuffer());
      } catch (error) {
        throw new PdfPreviewError('file', 'Failed to read PDF file response.', error);
      }
      if (session.cancelled) {
        return;
      }
      session.data = data;
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = getPdfPreviewWorkerSrc();
        session.worker = pdfjs.PDFWorker.create({});
      } catch (error) {
        throw new PdfPreviewError('resources', 'Failed to load PDF.js worker.', error);
      }
      // Security hardening: no eval-based font hinting and no XFA scripting.
      // getDocument detaches the buffer it receives, so hand it a copy and keep `data` for later pages.
      const metaTask = pdfjs.getDocument({
        data: data.slice(0),
        ...getPdfPreviewResourceOptions(),
        isEvalSupported: false,
        enableXfa: false,
        useWasm: false,
        worker: session.worker,
      });
      session.loadingTasks.push(metaTask);
      let metaPdf: PDFDocumentProxy;
      try {
        metaPdf = await metaTask.promise;
      } catch (error) {
        throw new PdfPreviewError('document', 'Failed to parse PDF file.', error);
      }
      if (session.cancelled) {
        return;
      }
      session.metaPdf = metaPdf;
      const viewport = (await metaPdf.getPage(1)).getViewport({ scale: PDF_SCALE });
      if (session.cancelled) {
        return;
      }
      setMeta({ numPages: metaPdf.numPages, width: viewport.width, height: viewport.height });
    };

    init().catch((error) => {
      if (!session.cancelled) {
        const code = getPdfPreviewErrorCode(error);
        // Keep the original error visible for deployment/CORS diagnostics while
        // showing users a concise, actionable preview failure message.
        console.warn('[file-manager] PDF preview failed', {
          code,
          src,
          error,
        });
        setErrorCode(code);
      }
    });

    return () => {
      session.cancelled = true;
      session.abortController.abort();
      session.observer?.disconnect();
      session.renderTasks.forEach((task) => task.cancel?.());
      session.textLayers.forEach((textLayer) => textLayer.cancel());
      session.loadingTasks.forEach((task) => task.destroy?.());
      session.pdfjs?.TextLayer.cleanup();
      session.worker?.destroy?.();
    };
  }, [src]);

  React.useEffect(() => {
    if (!meta || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updatePageScale = (el: HTMLElement, width: number) => {
      if (width > 0) {
        el.style.setProperty('--pdf-responsive-scale', String(width / meta.width));
      }
    };
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updatePageScale(entry.target as HTMLElement, entry.contentRect.width);
      }
    });
    pageElsRef.current.forEach((el) => {
      updatePageScale(el, el.getBoundingClientRect().width);
      resizeObserver.observe(el);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, [meta]);

  // Lazily render pages as their placeholders scroll into view.
  React.useEffect(() => {
    const session = sessionRef.current;
    if (!meta || !session?.pdfjs || !session.metaPdf) {
      return;
    }
    const { pdfjs, metaPdf } = session;

    const renderPage = async (pageNumber: number) => {
      if (session.cancelled || session.rendered.has(pageNumber) || session.inFlight.has(pageNumber)) {
        return;
      }
      const wrapper = pageElsRef.current.get(pageNumber);
      if (!wrapper) {
        return;
      }
      session.inFlight.add(pageNumber);
      // Page 1 reuses the already-loaded streaming document; rendering only that
      // one page on it keeps the document from promoting any image to pdf.js's
      // cross-page global cache (the path that breaks later pages). Every other
      // page renders in its own short-lived document built from the full bytes,
      // for the same isolation reason. getDocument detaches the buffer it is
      // given, so each document receives its own copy.
      let task: PDFDocumentLoadingTask | undefined;
      let textLayer: PdfTextLayer | undefined;
      try {
        let pdf: PDFDocumentProxy;
        if (pageNumber === 1 || !session.data) {
          pdf = metaPdf;
        } else {
          task = pdfjs.getDocument({
            data: session.data.slice(0),
            ...getPdfPreviewResourceOptions(),
            isEvalSupported: false,
            enableXfa: false,
            useWasm: false,
            worker: session.worker,
          });
          session.loadingTasks.push(task);
          pdf = await task.promise;
        }
        if (session.cancelled) {
          return;
        }
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: PDF_SCALE });
        const context = document.createElement('canvas').getContext('2d');
        if (!context) {
          return;
        }
        const canvas = context.canvas;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.setAttribute('aria-hidden', 'true');
        const pageContainer = document.createElement('div');
        pageContainer.className = PDF_PREVIEW_PAGE_CLASS;
        pageContainer.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
        const textLayerContainer = document.createElement('div');
        textLayerContainer.className = 'textLayer';
        pageContainer.replaceChildren(canvas, textLayerContainer);
        // The real page governs the wrapper height now; drop the placeholder ratio.
        wrapper.style.aspectRatio = '';
        wrapper.replaceChildren(pageContainer);
        textLayer = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent({
            includeMarkedContent: true,
            disableNormalization: true,
          }),
          container: textLayerContainer,
          viewport,
        });
        session.textLayers.add(textLayer);
        const textLayerRenderPromise = textLayer
          .render()
          .then(() => undefined)
          .catch((textLayerError) => {
            if (!session.cancelled) {
              console.warn('[file-manager] PDF text layer render failed', {
                pageNumber,
                src,
                error: textLayerError,
              });
            }
          })
          .finally(() => {
            if (textLayer) {
              session.textLayers.delete(textLayer);
            }
          });
        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          annotationMode: pdfjs.AnnotationMode.ENABLE,
        });
        session.renderTasks.push(renderTask);
        await renderTask.promise;
        if (session.cancelled) {
          return;
        }
        await textLayerRenderPromise;
        if (session.cancelled) {
          return;
        }
        session.rendered.add(pageNumber);
        session.observer?.unobserve(wrapper);
      } catch (renderError) {
        textLayer?.cancel();
        // Leave the placeholder in place; scrolling back can retry the page.
        if (!session.cancelled) {
          console.warn('[file-manager] PDF page render failed', {
            pageNumber,
            src,
            error: renderError,
          });
        }
      } finally {
        task?.destroy();
        session.inFlight.delete(pageNumber);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            renderPage(Number((entry.target as HTMLElement).dataset.page));
          }
        }
      },
      { rootMargin: '300px 0px' },
    );
    session.observer = observer;
    pageElsRef.current.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      if (session.observer === observer) {
        session.observer = undefined;
      }
    };
  }, [meta, src]);

  if (!src) {
    return null;
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', padding: 16 }}>
      {errorCode ? <Alert type="warning" showIcon message={t(PDF_PREVIEW_ERROR_MESSAGES[errorCode])} /> : null}
      {!meta && !errorCode ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : null}
      {meta
        ? Array.from({ length: meta.numPages }, (_, index) => index + 1).map((pageNumber) => (
            <div
              key={pageNumber}
              data-page={pageNumber}
              ref={(el) => {
                if (el) {
                  pageElsRef.current.set(pageNumber, el);
                } else {
                  pageElsRef.current.delete(pageNumber);
                }
              }}
              style={{
                width: '100%',
                maxWidth: meta.width,
                margin: '0 auto 16px',
                aspectRatio: `${meta.width} / ${meta.height}`,
                background: '#fff',
                border: '1px solid #f0f0f0',
              }}
            />
          ))
        : null}
    </div>
  );
};

const PdfHybridPreviewer = (props: FilePreviewerProps) => {
  const src = getFileUrl(props.file);
  return shouldUsePdfJsPreview(props.file, src) ? <PdfPreviewer {...props} /> : <IframePreviewer {...props} />;
};

const AudioPreviewer = ({ file }: FilePreviewerProps) => {
  const { t } = useTranslation();
  const src = getFileUrl(file);
  if (!src) {
    return null;
  }
  return (
    <audio controls>
      <source src={src} type={file?.type || file?.mimetype} />
      {t('Your browser does not support the audio tag.')}
    </audio>
  );
};

const VideoPreviewer = ({ file }: FilePreviewerProps) => {
  const { t } = useTranslation();
  const src = getFileUrl(file);
  if (!src) {
    return null;
  }
  return (
    <video controls width="100%" height="100%">
      <source src={src} type={file?.type || file?.mimetype} />
      {t('Your browser does not support the video tag.')}
    </video>
  );
};

const UnsupportedPreviewer = (props: FilePreviewerProps) => {
  const { file } = props;
  return (
    <Alert
      type="warning"
      description={
        <Trans ns={NAMESPACE}>
          {'File type is not supported for previewing, please '}
          {props.onDownload ? (
            <a onClick={() => props.onDownload?.(file)} style={{ textDecoration: 'underline', cursor: 'pointer' }}>
              {'download it to preview'}
            </a>
          ) : (
            <span>{'download it to preview'}</span>
          )}
        </Trans>
      }
      showIcon
    />
  );
};

filePreviewTypes.add({
  match() {
    return true;
  },
  Previewer: wrapWithModalPreviewer(UnsupportedPreviewer),
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'image/*');
  },
  getThumbnailURL(file) {
    return getPreviewFileUrl(file);
  },
  Previewer: ImagePreviewer,
});

filePreviewTypes.add({
  match(file) {
    return ['text/plain', 'application/json'].some((type) => matchMimetype(file, type));
  },
  Previewer: wrapWithModalPreviewer(IframePreviewer),
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'audio/*');
  },
  Previewer: wrapWithModalPreviewer(AudioPreviewer),
});

filePreviewTypes.add({
  match(file) {
    return matchMimetype(file, 'video/*');
  },
  Previewer: wrapWithModalPreviewer(VideoPreviewer),
});

filePreviewTypes.add({
  match(file) {
    return isActiveContentFile(file, getFileUrl(file));
  },
  Previewer: wrapWithModalPreviewer(UnsupportedPreviewer),
});

filePreviewTypes.add({
  match(file) {
    return isPdfFile(file, getFileUrl(file));
  },
  Previewer: wrapWithModalPreviewer(PdfHybridPreviewer),
});

export const FilePreviewRenderer = (props: FilePreviewerProps) => {
  const normalized = normalizePreviewFile(props.file);
  if (!normalized) {
    return null;
  }
  const { Previewer } = filePreviewTypes.getTypeByFile(normalized) ?? {};
  if (!Previewer) {
    return null;
  }
  return <Previewer {...props} file={normalized} />;
};
