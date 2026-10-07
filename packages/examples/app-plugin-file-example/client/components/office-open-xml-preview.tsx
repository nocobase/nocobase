import { useEffect, useRef, useState, type ReactElement } from 'react';

import type { OfficeOpenXmlFormat } from '../lib/office-format.js';
import type { FilePreviewLabels } from './file-preview-dialog.js';
import { fileUrlCredentials } from '../lib/file-url.js';

// Covers the file request, the Viewer import and the first render together, so a request or renderer that never
// settles ends in the failure message instead of an indefinite loading state.
const OFFICE_OPEN_XML_PREVIEW_TIMEOUT_MS = 180_000;

interface OfficeOpenXmlViewer {
  load(source: string | ArrayBuffer): Promise<void>;
  destroy(): void;
}

export interface OfficeOpenXmlPreviewProps {
  readonly format: OfficeOpenXmlFormat;
  readonly url?: string;
  readonly error?: string;
  readonly labels: FilePreviewLabels;
}

export function OfficeOpenXmlPreview({
  format,
  url,
  error,
  labels,
}: OfficeOpenXmlPreviewProps): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [viewerError, setViewerError] = useState<string>();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !url || error) return undefined;

    let active = true;
    let viewer: OfficeOpenXmlViewer | undefined;
    const controller = new AbortController();
    const reportViewerError = (cause: unknown): void => {
      if (!active || isAbortError(cause)) return;
      // The first failure settles the preview; later ones, including the timeout, are ignored.
      active = false;
      const failedViewer = viewer;
      viewer = undefined;
      failedViewer?.destroy();
      setViewerError(
        cause instanceof OfficeOpenXmlRequestError
          ? cause.message
          : labels.previewFailed,
      );
    };
    const timeout = window.setTimeout(() => {
      reportViewerError(new Error('The preview timed out.'));
      controller.abort();
    }, OFFICE_OPEN_XML_PREVIEW_TIMEOUT_MS);

    void (async () => {
      const data = await fetchOfficeOpenXml(
        url,
        controller.signal,
        labels.previewFailed,
      );
      if (!active) return;
      const createdViewer = await createOfficeOpenXmlViewer(
        format,
        host,
        reportViewerError,
      );
      if (!active) {
        createdViewer.destroy();
        return;
      }
      viewer = createdViewer;
      await viewer.load(data);
      if (!active) return;
      window.clearTimeout(timeout);
      setLoaded(true);
    })().catch(reportViewerError);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
      viewer?.destroy();
    };
  }, [error, format, labels.previewFailed, url]);

  const resolvedError = error ?? viewerError;
  if (resolvedError) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {resolvedError}
      </p>
    );
  }
  if (!url) {
    return <div role='status'>{labels.loading}</div>;
  }

  return (
    <div className='relative h-[60vh] min-h-0 w-full overflow-hidden bg-muted/30'>
      {!loaded ? (
        <div
          role='status'
          className='absolute inset-0 z-10 flex items-center justify-center bg-background'
        >
          {labels.loading}
        </div>
      ) : null}
      <div
        ref={hostRef}
        className='h-full min-h-0 w-full overflow-hidden'
        data-office-open-xml-format={format}
      />
    </div>
  );
}

class OfficeOpenXmlRequestError extends Error {}

async function fetchOfficeOpenXml(
  url: string,
  signal: AbortSignal,
  failureMessage: string,
): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    credentials: fileUrlCredentials(url),
    signal,
  });
  if (!response.ok) {
    throw new OfficeOpenXmlRequestError(
      `${failureMessage} (${response.status})`,
    );
  }
  return await response.arrayBuffer();
}

function isAbortError(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}

async function createOfficeOpenXmlViewer(
  format: OfficeOpenXmlFormat,
  host: HTMLElement,
  onError: (error: Error) => void,
): Promise<OfficeOpenXmlViewer> {
  const commonOptions = {
    mode: 'main' as const,
    useGoogleFonts: false,
    onError,
  };
  switch (format) {
    case 'docx': {
      const { DocxScrollViewer } = await import('@silurus/ooxml/docx');
      return new DocxScrollViewer(host, {
        ...commonOptions,
        enableTextSelection: true,
        gap: 16,
        progressiveLayout: true,
      });
    }
    case 'pptx': {
      const { PptxScrollViewer } = await import('@silurus/ooxml/pptx');
      return new PptxScrollViewer(host, {
        ...commonOptions,
        enableTextSelection: true,
        gap: 16,
        progressiveLayout: true,
      });
    }
    case 'xlsx': {
      const { XlsxViewer } = await import('@silurus/ooxml/xlsx');
      return new XlsxViewer(host, {
        ...commonOptions,
        showZoomSlider: true,
      });
    }
  }
}
