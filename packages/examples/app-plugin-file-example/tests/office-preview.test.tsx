import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { FileRecord } from '@nocobase/app-plugin-file/client';
import {
  FilePreviewDialog,
  type FilePreviewLabels,
} from '../client/components/file-preview-dialog.js';
import { previewKind } from '../client/lib/files.js';
const viewerMocks = vi.hoisted(() => ({
  docx: {
    construct: vi.fn<(host: HTMLElement, options: unknown) => void>(),
    destroy: vi.fn<() => void>(),
    load: vi.fn<(source: string | ArrayBuffer) => Promise<void>>(),
  },
  pptx: {
    construct: vi.fn<(host: HTMLElement, options: unknown) => void>(),
    destroy: vi.fn<() => void>(),
    load: vi.fn<(source: string | ArrayBuffer) => Promise<void>>(),
  },
  xlsx: {
    construct: vi.fn<(host: HTMLElement, options: unknown) => void>(),
    destroy: vi.fn<() => void>(),
    load: vi.fn<(source: string | ArrayBuffer) => Promise<void>>(),
  },
}));

vi.mock('@silurus/ooxml/docx', () => ({
  DocxScrollViewer: class {
    constructor(host: HTMLElement, options: unknown) {
      viewerMocks.docx.construct(host, options);
    }

    load(source: string | ArrayBuffer): Promise<void> {
      return viewerMocks.docx.load(source);
    }

    destroy(): void {
      viewerMocks.docx.destroy();
    }
  },
}));

vi.mock('@silurus/ooxml/pptx', () => ({
  PptxScrollViewer: class {
    constructor(host: HTMLElement, options: unknown) {
      viewerMocks.pptx.construct(host, options);
    }

    load(source: string | ArrayBuffer): Promise<void> {
      return viewerMocks.pptx.load(source);
    }

    destroy(): void {
      viewerMocks.pptx.destroy();
    }
  },
}));

vi.mock('@silurus/ooxml/xlsx', () => ({
  XlsxViewer: class {
    constructor(host: HTMLElement, options: unknown) {
      viewerMocks.xlsx.construct(host, options);
    }

    load(source: string | ArrayBuffer): Promise<void> {
      return viewerMocks.xlsx.load(source);
    }

    destroy(): void {
      viewerMocks.xlsx.destroy();
    }
  },
}));

const labels: FilePreviewLabels = {
  preview: 'Preview',
  download: 'Download',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  loading: 'Loading',
  unsupported: 'Download this file',
  previewFailed: 'Preview failed',
};
function file(
  format: string,
  contentUrl = `/uploads/example.${format}`,
): FileRecord {
  return {
    id: format,
    disk: 'local',
    key: `example.${format}`,
    ext: format,
    filename: `example.${format}`,
    mimeType: 'application/octet-stream',
    size: 3,
    createdAt: '2026-09-18',
    updatedAt: '2026-09-18',
    contentUrl,
  };
}
beforeEach(() => {
  for (const viewer of Object.values(viewerMocks)) {
    viewer.construct.mockReset();
    viewer.load.mockReset().mockResolvedValue(undefined);
    viewer.destroy.mockReset();
  }
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it.each(['docx', 'xlsx', 'pptx'] as const)(
  'previews %s locally and keeps downloads available',
  async (format) => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(
      <FilePreviewDialog
        files={[file(format)]}
        index={0}
        labels={labels}
        onIndexChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await waitFor(() =>
      expect(viewerMocks[format].load).toHaveBeenCalledOnce(),
    );
    expect(fetchMock).toHaveBeenCalledWith(`/uploads/example.${format}`, {
      credentials: 'same-origin',
      signal: expect.any(AbortSignal),
    });
    expect(viewerMocks[format].construct).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ useGoogleFonts: false }),
    );
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      `/uploads/example.${format}`,
    );
    view.unmount();
    expect(viewerMocks[format].destroy).toHaveBeenCalledOnce();
  },
);
it('omits cross-origin credentials and recovers when switching away from a failed file', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 403 }))
    .mockResolvedValue(new Response(new Uint8Array([1])));
  vi.stubGlobal('fetch', fetchMock);
  const files = [
    file('docx', 'https://files.example.com/test.docx'),
    file('xlsx'),
  ];
  const props = { files, labels, onIndexChange: vi.fn(), onClose: vi.fn() };
  const view = render(<FilePreviewDialog {...props} index={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('403');
  expect(fetchMock).toHaveBeenCalledWith(files[0]?.contentUrl, {
    credentials: 'omit',
    signal: expect.any(AbortSignal),
  });
  view.rerender(<FilePreviewDialog {...props} index={1} />);
  await waitFor(() => expect(viewerMocks.xlsx.load).toHaveBeenCalledOnce());
  expect(screen.queryByRole('alert')).toBeNull();
  // Spreadsheet navigation must not navigate to a different attachment.
  const host = document.querySelector('[data-office-open-xml-format="xlsx"]');
  expect(host).not.toBeNull();
  fireEvent.keyDown(host!, { key: 'ArrowLeft' });
  expect(props.onIndexChange).not.toHaveBeenCalled();
});
it('reports a failure when the Viewer never finishes rendering', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(new Response(new Uint8Array([1]))),
  );
  viewerMocks.docx.load.mockReturnValue(new Promise<void>(() => undefined));
  render(
    <FilePreviewDialog
      files={[file('docx')]}
      index={0}
      labels={labels}
      onIndexChange={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  await waitFor(() => expect(viewerMocks.docx.load).toHaveBeenCalledOnce());

  await act(() => vi.advanceTimersByTimeAsync(180_000));

  expect(screen.getByRole('alert')).toHaveTextContent('Preview failed');
  expect(viewerMocks.docx.destroy).toHaveBeenCalledOnce();
});
it('aborts pending content when the preview closes', async () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>((_url, options) => {
      signal = options?.signal ?? undefined;
      return new Promise(() => undefined);
    }),
  );
  const props = {
    files: [file('pptx')],
    labels,
    onIndexChange: vi.fn(),
    onClose: vi.fn(),
  };
  const view = render(<FilePreviewDialog {...props} index={0} />);
  await waitFor(() => expect(signal).toBeDefined());
  view.rerender(<FilePreviewDialog {...props} index={-1} />);
  expect(signal?.aborted).toBe(true);
});
it('keeps legacy formats download-only and rejects active content disguised as Office', () => {
  for (const extension of ['doc', 'xls', 'ppt', 'odt'])
    expect(previewKind(file(extension))).toBe('unsupported');
  expect(previewKind({ ...file('docx'), mimeType: 'text/html' })).toBe(
    'unsupported',
  );
});
it('embeds the PDF response as application/pdf whatever type the route sends', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(
      async () =>
        new Response('pdf', {
          headers: { 'content-type': 'application/octet-stream' },
        }),
    ),
  );
  const create = vi.fn((_blob: Blob) => 'blob:http://localhost/preview');
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: create,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  render(
    <FilePreviewDialog
      files={[file('pdf')]}
      labels={labels}
      index={0}
      onIndexChange={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  await waitFor(() =>
    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'blob:http://localhost/preview',
    ),
  );
  expect(create.mock.calls[0]?.[0].type).toBe('application/pdf');
});
it('refuses to embed a PDF response that answers with an active document', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(
      async () =>
        new Response('<!doctype html><script>alert(1)</script>', {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    ),
  );
  const create = vi.fn((_blob: Blob) => 'blob:http://localhost/preview');
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: create,
  });
  render(
    <FilePreviewDialog
      files={[file('pdf')]}
      labels={labels}
      index={0}
      onIndexChange={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('Preview failed');
  expect(create).not.toHaveBeenCalled();
  expect(document.querySelector('iframe')).toBeNull();
});
