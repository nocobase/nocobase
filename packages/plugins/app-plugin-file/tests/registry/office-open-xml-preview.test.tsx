import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FilePreviewDialog } from '../../.registry-test-app/client/extensions/nocobase-file-component-ui/index';
import type { FileRecord } from '../../client/index.js';

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

function fileRecord(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: 'file-1',
    filename: 'report.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 2048,
    disk: 'local',
    key: 'objects/file-1.docx',
    ext: 'docx',
    createdAt: '2026-08-27T00:00:00.000Z',
    updatedAt: '2026-08-27T00:00:00.000Z',
    contentUrl: '/api/files/file-1/content',
    ...overrides,
  };
}

beforeEach(() => {
  for (const viewer of Object.values(viewerMocks)) {
    viewer.construct.mockReset();
    viewer.destroy.mockReset();
    viewer.load.mockReset().mockResolvedValue(undefined);
  }
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Office Open XML preview', () => {
  it.each([
    {
      format: 'docx',
      filename: 'report.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      contentUrl: '/api/files/file-1/content',
      expectedUrl: '/api/files/file-1/content',
      credentials: 'same-origin',
    },
    {
      format: 'xlsx',
      filename: 'budget.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      contentUrl: 'https://cdn.example.com/budget.xlsx',
      expectedUrl: 'https://cdn.example.com/budget.xlsx',
      credentials: 'omit',
    },
    {
      format: 'pptx',
      filename: 'slides.pptx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      contentUrl: '/api/files/file-1/content',
      expectedUrl: '/api/files/file-1/content',
      credentials: 'same-origin',
    },
  ] as const)(
    'fetches and renders .$format without Office Online',
    async ({
      format,
      filename,
      mimeType,
      contentUrl,
      expectedUrl,
      credentials,
    }) => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));
      vi.stubGlobal('fetch', fetchMock);
      const { unmount } = render(
        <FilePreviewDialog
          files={[
            fileRecord({
              filename,
              mimeType,
              contentUrl,
            }),
          ]}
          open
          onOpenChange={vi.fn()}
        />,
      );

      const viewer = viewerMocks[format];
      await waitFor(() => expect(viewer.load).toHaveBeenCalledOnce());
      expect(fetchMock).toHaveBeenCalledWith(expectedUrl, {
        credentials,
        signal: expect.any(AbortSignal),
      });
      expect(viewer.construct).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          mode: 'main',
          onError: expect.any(Function),
          useGoogleFonts: false,
        }),
      );
      expect(viewer.load.mock.calls[0]?.[0]).toBeInstanceOf(ArrayBuffer);
      expect(
        document.querySelector(`[data-office-open-xml-format="${format}"]`),
      ).not.toBeNull();
      expect(screen.queryByTitle(filename)).toBeNull();

      unmount();
      expect(viewer.destroy).toHaveBeenCalledOnce();
    },
  );

  it('shows a download fallback when the file request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 503 })),
    );
    render(
      <FilePreviewDialog files={[fileRecord()]} open onOpenChange={vi.fn()} />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Preview request failed (503).',
    );
    expect(screen.getByRole('button', { name: 'Download file' })).toBeVisible();
    expect(viewerMocks.docx.construct).not.toHaveBeenCalled();
  });

  it('destroys a Viewer and falls back when OOXML rendering fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))),
    );
    viewerMocks.docx.load.mockRejectedValueOnce(
      new Error('Invalid OOXML package.'),
    );
    render(
      <FilePreviewDialog files={[fileRecord()]} open onOpenChange={vi.fn()} />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to render this Office Open XML file.',
    );
    expect(viewerMocks.docx.destroy).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Download file' })).toBeVisible();
  });

  it('handles a Viewer-managed render error after the initial load', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))),
    );
    render(
      <FilePreviewDialog files={[fileRecord()]} open onOpenChange={vi.fn()} />,
    );
    await waitFor(() => expect(viewerMocks.docx.load).toHaveBeenCalledOnce());
    const options = viewerMocks.docx.construct.mock.calls[0]?.[1] as {
      readonly onError: (error: Error) => void;
    };

    act(() => options.onError(new Error('Late render failure.')));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to render this Office Open XML file.',
    );
    expect(viewerMocks.docx.destroy).toHaveBeenCalledOnce();
  });

  it('falls back to a download when the Viewer never finishes rendering', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))),
    );
    viewerMocks.docx.load.mockReturnValue(new Promise<void>(() => undefined));
    render(
      <FilePreviewDialog files={[fileRecord()]} open onOpenChange={vi.fn()} />,
    );
    await waitFor(() => expect(viewerMocks.docx.load).toHaveBeenCalledOnce());
    expect(screen.getByRole('status')).toHaveTextContent('Loading preview...');

    await act(() => vi.advanceTimersByTimeAsync(180_000));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The preview did not finish loading within 3 minutes.',
    );
    expect(viewerMocks.docx.destroy).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Download file' })).toBeVisible();
  });

  it('aborts a file request that never settles once the preview times out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((_input, init) => {
        signal = init?.signal ?? undefined;
        return new Promise<Response>(() => undefined);
      }),
    );
    render(
      <FilePreviewDialog files={[fileRecord()]} open onOpenChange={vi.fn()} />,
    );
    await waitFor(() => expect(signal).toBeDefined());

    await act(() => vi.advanceTimersByTimeAsync(180_000));

    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The preview did not finish loading within 3 minutes.',
    );
    expect(viewerMocks.docx.construct).not.toHaveBeenCalled();
  });

  it('keeps a rendered preview once the timeout would have elapsed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(new Uint8Array([1, 2, 3]))),
    );
    render(
      <FilePreviewDialog files={[fileRecord()]} open onOpenChange={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.queryByText('Loading preview...')).toBeNull(),
    );

    await act(() => vi.advanceTimersByTimeAsync(180_000));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(viewerMocks.docx.destroy).not.toHaveBeenCalled();
  });

  it('aborts an in-flight OOXML request when the dialog unmounts', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>((_input, init) => {
        signal = init?.signal ?? undefined;
        return new Promise<Response>(() => undefined);
      }),
    );
    const { unmount } = render(
      <FilePreviewDialog files={[fileRecord()]} open onOpenChange={vi.fn()} />,
    );
    await waitFor(() => expect(signal).toBeDefined());

    unmount();

    expect(signal?.aborted).toBe(true);
    expect(viewerMocks.docx.construct).not.toHaveBeenCalled();
  });
});
