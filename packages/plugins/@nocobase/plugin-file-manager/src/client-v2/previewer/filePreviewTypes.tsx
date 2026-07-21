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

// Static placeholder icons live under the app's public folder, served by the gateway at the
// runtime public path (`/nocobase/v/` in the modern client, `/nocobase/` in v1). Prefix the bare
// `/file-placeholder/...` paths so they resolve when APP_PUBLIC_PATH !== '/'. We intentionally
// read only `__nocobase_public_path__` (not v1's `__nocobase_dev_public_path__`, which is '/'
// for the v1 dev-server-direct scenario) because this app is always reached through the gateway.
const PUBLIC_PATH = (typeof window !== 'undefined' && window['__nocobase_public_path__']) || '/';

const withPublicPath = (path: string) => `${PUBLIC_PATH.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export interface FilePreviewerProps {
  file: any;
  index: number;
  list: any[];
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

export function normalizePreviewFile(file: any) {
  if (!file) {
    return file;
  }
  if (typeof file === 'string') {
    return { url: file };
  }
  return file;
}

export function getPreviewFileUrl(file: any) {
  if (!file) {
    return '';
  }
  if (typeof file === 'string') {
    return file;
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

const ACTIVE_CONTENT_MIMETYPES = new Set([
  'application/pdf',
  'application/xhtml+xml',
  'application/xml',
  'application/xslt+xml',
  'image/svg+xml',
  'text/html',
  'text/xml',
]);
const ACTIVE_CONTENT_EXTENSIONS = new Set(['htm', 'html', 'pdf', 'svg', 'svgz', 'xht', 'xhtml', 'xml', 'xsl', 'xslt']);

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
    return match(file.type, type);
  }
  if (file.mimetype) {
    return match(file.mimetype, type);
  }
  if (file.url) {
    return match(EXT_MIMETYPE_MAP[getExtFromName(file.url)] || '', type);
  }
  return false;
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
    return '';
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
  const src = getFileUrl(file);
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

type NocoBaseWindow = Window & {
  __nocobase_modern_client_prefix__?: string;
  __nocobase_public_path__?: string;
  __webpack_public_path__?: string;
};

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
          credentials: url.origin === location.origin ? 'include' : 'omit',
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
  return isSameOriginUrl(src) ? <PdfPreviewer {...props} /> : <IframePreviewer {...props} />;
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
