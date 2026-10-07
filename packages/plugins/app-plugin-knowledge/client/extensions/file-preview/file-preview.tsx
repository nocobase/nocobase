/**
 * One file previewed in place with the file plugin's preview components: images, PDFs (through a local blob, the
 * route serving them as it does), text and Markdown, audio and video, and DOCX, XLSX and PPTX rendered in the browser.
 * What cannot be shown offers its download. The bytes are only ever read at the file's `contentUrl`.
 */
import { useEffect, useMemo, useState, type ReactElement } from 'react';

import { FilePreviewContent } from './components/previewers/file-preview-content.js';
import {
  resolveFilePreviewKind,
  type FilePreviewKind,
} from './lib/file-preview.js';
import { fileUrlCredentials, resolveSafeFileUrl } from './lib/file-url.js';
import type { FileRecord } from './types.js';

export type { FileRecord } from './types.js';

export function FilePreview({
  file,
  onDownload,
}: {
  readonly file: FileRecord;
  readonly onDownload?: () => void;
}): ReactElement {
  const sourceUrl = resolveSafeFileUrl(file.contentUrl ?? '');
  const [text, setText] = useState<string>();
  const [blobUrl, setBlobUrl] = useState<string>();
  const [error, setError] = useState<string | undefined>(() =>
    !sourceUrl ? 'File URL is missing or not allowed.' : undefined,
  );
  const kind: FilePreviewKind = useMemo(
    () => resolveFilePreviewKind(file),
    [file],
  );
  useEffect(() => {
    if (!sourceUrl || kind !== 'pdf') return undefined;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    void fetch(sourceUrl, {
      credentials: fileUrlCredentials(sourceUrl),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load the PDF preview.');
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to load the PDF preview.',
          );
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [sourceUrl, kind]);
  const url = kind === 'pdf' ? blobUrl : sourceUrl;
  useEffect(() => {
    if (!url || !['text', 'markdown'].includes(kind)) return undefined;
    const controller = new AbortController();
    void fetch(url, {
      credentials: fileUrlCredentials(url),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Preview request failed (${response.status}).`);
        return response.text();
      })
      .then(setText)
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === 'AbortError'))
          setError(
            cause instanceof Error
              ? cause.message
              : 'Unable to load the file preview.',
          );
      });
    return () => controller.abort();
  }, [file, kind, url]);
  return (
    <FilePreviewContent
      file={file}
      kind={kind}
      url={url}
      text={text}
      error={error}
      onDownload={onDownload}
    />
  );
}
