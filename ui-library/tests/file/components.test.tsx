import { useState } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import {
  ClientFileRepositoryManager,
  type FileRecord,
} from '@nocobase/app-plugin-file/client';
import { createApiClient } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../registry/file/file-component-ui/locales/en-US.js';
import {
  FileUploadField,
  FileList,
  FilePreviewDialog,
  FileThumbnail,
} from '../../registry/file/file-component-ui/index';

function record(overrides: Partial<FileRecord> = {}): FileRecord {
  return {
    id: 'test-id',
    disk: 'local',
    key: 'objects/test.txt',
    ext: 'txt',
    filename: 'invoice.txt',
    mimeType: 'text/plain',
    size: 7,
    createdAt: '2026-09-08T00:00:00Z',
    updatedAt: '2026-09-08T00:00:00Z',
    contentUrl: '/main/uploads/invoices/test.txt',
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('uploads with the real Client manager and removes metadata through Repository actions', async () => {
  const requests: { path: string; init?: RequestInit }[] = [];
  const row = record();
  const api = createApiClient({
    baseURL: 'http://localhost/main/api',
    fetch: async (input, init) => {
      requests.push({ path: String(input), init });
      return Response.json({
        data: String(input).endsWith('/uploadOne')
          ? { record: row, createdTargets: [] }
          : { deletedCount: 1 },
      });
    },
  });
  const repository = new ClientFileRepositoryManager(api).repository(
    'invoiceAttachments',
  );
  const status = vi.fn();
  function Page() {
    const [value, setValue] = useState<readonly FileRecord[]>([]);
    return (
      <FileUploadField
        repository={repository}
        value={value}
        onChange={setValue}
        removeOnDelete
        onStatusChange={status}
      />
    );
  }
  const user = userEvent.setup();
  render(<Page />);
  const file = new File(['invoice'], 'invoice.txt', { type: 'text/plain' });
  fireEvent.change(
    screen.getByLabelText('Choose file', { selector: 'input' }),
    { target: { files: [file] } },
  );
  await screen.findByText('Done');
  expect(requests[0]?.path).toBe(
    'http://localhost/main/api/invoiceAttachments/uploadOne',
  );
  expect(requests[0]?.init?.body).toBeInstanceOf(FormData);
  expect((requests[0]?.init?.body as FormData).get('file')).toBe(file);
  await user.click(screen.getByRole('button', { name: 'Remove: invoice.txt' }));
  await waitFor(() =>
    expect(screen.queryByText('Done')).not.toBeInTheDocument(),
  );
  expect(requests[1]?.path).toBe(
    'http://localhost/main/api/invoiceAttachments/deleteOne',
  );
  expect(status).toHaveBeenLastCalledWith('idle');
});

it('aborts pending uploads on cancellation and never adds a cancelled value', async () => {
  let signal: AbortSignal | undefined;
  const api = createApiClient({
    baseURL: 'http://localhost/api',
    fetch: (_input, init) => {
      signal = init?.signal ?? undefined;
      return new Promise((_resolve, reject) =>
        signal?.addEventListener('abort', () =>
          reject(new DOMException('Cancelled', 'AbortError')),
        ),
      );
    },
  });
  const repository = new ClientFileRepositoryManager(api).repository(
    'invoiceAttachments',
  );
  const change = vi.fn();
  const user = userEvent.setup();
  render(
    <FileUploadField repository={repository} value={[]} onChange={change} />,
  );
  fireEvent.change(
    screen.getByLabelText('Choose file', { selector: 'input' }),
    { target: { files: [new File(['x'], 'pending.txt')] } },
  );
  await waitFor(() => expect(signal).toBeDefined());
  await user.click(screen.getByRole('button', { name: 'Cancel pending.txt' }));
  expect(signal?.aborted).toBe(true);
  expect(change).not.toHaveBeenCalled();
});

it('reports an upload failure and allows retry with the same Repository contract', async () => {
  let attempt = 0;
  const api = createApiClient({
    baseURL: 'http://localhost/api',
    fetch: async () =>
      ++attempt === 1
        ? Response.json(
            {
              error: {
                code: 413,
                status: 'INVALID_ARGUMENT',
                reason: 'BODY_TOO_LARGE',
                domain: 'file',
                message: 'Upload request body is too large.',
              },
            },
            { status: 413 },
          )
        : Response.json({ data: { record: record(), createdTargets: [] } }),
  });
  const repository = new ClientFileRepositoryManager(api).repository(
    'invoiceAttachments',
  );
  const onError = vi.fn();
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <FileUploadField
      repository={repository}
      value={[]}
      onChange={onChange}
      onError={onError}
    />,
  );
  fireEvent.change(
    screen.getByLabelText('Choose file', { selector: 'input' }),
    { target: { files: [new File(['invoice'], 'invoice.txt')] } },
  );
  await screen.findByRole('button', { name: 'Retry: invoice.txt' });
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ status: 413, reason: 'BODY_TOO_LARGE' }),
  );
  expect(onChange).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Retry: invoice.txt' }));
  await waitFor(() => expect(onChange).toHaveBeenCalledWith([record()]));
});

it('downloads the returned contentUrl and rejects unsafe links without a legacy token request', async () => {
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.href).toBe(
        'http://localhost:3000/main/uploads/invoices/test.txt',
      );
    });
  const onError = vi.fn();
  const user = userEvent.setup();
  const { rerender } = render(
    <FileList files={[record()]} onError={onError} />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Download: invoice.txt' }),
  );
  expect(click).toHaveBeenCalledOnce();
  rerender(
    <FileList
      files={[record({ contentUrl: 'javascript:alert(1)' })]}
      onError={onError}
    />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Download: invoice.txt' }),
  );
  await waitFor(() => expect(onError).toHaveBeenCalled());
  expect(click).toHaveBeenCalledOnce();
});

it('uses the custom download callback for images, including preview navigation and failures', async () => {
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => undefined);
  const onDownload = vi.fn();
  const first = record({ filename: 'first.png', mimeType: 'image/png' });
  const second = record({
    id: 'second',
    filename: 'second.png',
    mimeType: 'image/png',
  });
  const user = userEvent.setup();
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'app', resources: enUS },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <FileList files={[first, second]} onDownload={onDownload} />
    </TestI18nProvider>,
  );

  await user.click(screen.getByRole('button', { name: 'Preview: first.png' }));
  const dialog = within(screen.getByRole('dialog'));
  await user.click(dialog.getByRole('button', { name: 'Download: first.png' }));
  expect(onDownload).toHaveBeenNthCalledWith(1, first);

  await user.click(dialog.getByRole('button', { name: 'Next file' }));
  await user.click(
    dialog.getByRole('button', { name: 'Download: second.png' }),
  );
  expect(onDownload).toHaveBeenNthCalledWith(2, second);

  fireEvent.error(dialog.getByAltText('second.png'));
  await user.click(dialog.getByRole('button', { name: 'Download file' }));
  expect(onDownload).toHaveBeenNthCalledWith(3, second);
  expect(onDownload).toHaveBeenCalledTimes(3);
  expect(click).not.toHaveBeenCalled();
});

it.each(['throw', 'reject'] as const)(
  'reports a custom preview download failure when the callback chooses to %s',
  async (failure) => {
    const error = new Error('Download authorization failed.');
    const onDownload = vi.fn(() => {
      if (failure === 'throw') throw error;
      return Promise.reject(error);
    });
    const onError = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const runtime = await createTestI18nRuntime({
      application: { namespace: 'app', resources: enUS },
    });
    const user = userEvent.setup();
    render(
      <TestI18nProvider runtime={runtime}>
        <FilePreviewDialog
          files={[record({ filename: 'photo.png', mimeType: 'image/png' })]}
          open
          onOpenChange={() => undefined}
          onDownload={onDownload}
          onError={onError}
        />
      </TestI18nProvider>,
    );
    await user.click(
      screen.getByRole('button', { name: 'Download: photo.png' }),
    );
    await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
    expect(click).not.toHaveBeenCalled();
  },
);

it('previews a Repository record as text and shows safe image thumbnails', async () => {
  const fetcher = vi.fn(async () => new Response('Invoice details'));
  vi.stubGlobal('fetch', fetcher);
  render(
    <FilePreviewDialog
      files={[record()]}
      open
      onOpenChange={() => undefined}
    />,
  );
  await screen.findByText('Invoice details');
  expect(fetcher).toHaveBeenCalledWith(
    '/main/uploads/invoices/test.txt',
    expect.objectContaining({ credentials: 'same-origin' }),
  );
  render(
    <FileThumbnail
      file={record({ filename: 'invoice.png', mimeType: 'image/png' })}
    />,
  );
  expect(screen.getByAltText('invoice.png')).toHaveAttribute(
    'src',
    '/main/uploads/invoices/test.txt',
  );
});

it('replaces an image that fails to decode with a download fallback', async () => {
  const onDownload = vi.fn();
  const { FilePreviewContent } =
    await import('../../registry/file/file-component-ui/components/previewers/file-preview-content.js');
  const file = record({ filename: 'corrupt.png', mimeType: 'image/png' });
  const { rerender } = render(
    <FilePreviewContent
      file={file}
      kind='image'
      url='/main/uploads/invoices/corrupt.png'
      onDownload={onDownload}
    />,
  );
  fireEvent.error(screen.getByAltText('corrupt.png'));
  expect(
    await screen.findByText(
      'This image could not be displayed. It may be corrupted or in an unsupported format.',
    ),
  ).toBeInTheDocument();
  // The fallback must not load the bytes that just failed a second time.
  expect(screen.queryByAltText('corrupt.png')).not.toBeInTheDocument();
  expect(screen.getByLabelText('corrupt.png')).toHaveAttribute(
    'data-slot',
    'file-thumbnail',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Download file' }));
  expect(onDownload).toHaveBeenCalledOnce();
  rerender(
    <FilePreviewContent
      file={file}
      kind='image'
      url='/main/uploads/invoices/fixed.png'
      onDownload={onDownload}
    />,
  );
  expect(screen.getByAltText('corrupt.png')).toHaveAttribute(
    'src',
    '/main/uploads/invoices/fixed.png',
  );
});

it('drops a thumbnail that fails to load to its icon and retries a new URL', () => {
  const file = record({ filename: 'photo.png', mimeType: 'image/png' });
  const { rerender } = render(
    <FileThumbnail file={file} url='/main/uploads/invoices/broken.png' />,
  );
  fireEvent.error(screen.getByAltText('photo.png'));
  expect(screen.queryByAltText('photo.png')).not.toBeInTheDocument();
  expect(screen.getByLabelText('photo.png')).toHaveAttribute(
    'data-slot',
    'file-thumbnail',
  );
  rerender(
    <FileThumbnail file={file} url='/main/uploads/invoices/fixed.png' />,
  );
  expect(screen.getByAltText('photo.png')).toHaveAttribute(
    'src',
    '/main/uploads/invoices/fixed.png',
  );
});

it.each([
  ['/main/uploads/invoices/test.pdf', 'same-origin'],
  ['https://cdn.example.test/invoice.pdf', 'omit'],
])(
  'previews PDF %s without sending credentials to cross-origin storage',
  async (contentUrl, credentials) => {
    const fetcher = vi.fn(
      async () =>
        new Response('pdf', { headers: { 'content-type': 'application/pdf' } }),
    );
    vi.stubGlobal('fetch', fetcher);
    const create = vi.fn(() => 'blob:http://localhost/preview');
    const revoke = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: create,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revoke,
    });
    const { unmount } = render(
      <FilePreviewDialog
        files={[
          record({
            filename: 'invoice.pdf',
            mimeType: 'application/pdf',
            contentUrl,
          }),
        ]}
        open
        onOpenChange={() => undefined}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTitle('invoice.pdf')).toHaveAttribute(
        'src',
        'blob:http://localhost/preview',
      ),
    );
    expect(fetcher).toHaveBeenCalledWith(
      contentUrl,
      expect.objectContaining({ credentials }),
    );
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:http://localhost/preview');
  },
);

it('embeds the PDF response as application/pdf whatever type the route sends', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
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
      files={[
        record({
          filename: 'invoice.pdf',
          mimeType: 'application/pdf',
          contentUrl: '/main/uploads/invoices/test.pdf',
        }),
      ]}
      open
      onOpenChange={() => undefined}
    />,
  );
  await waitFor(() => expect(create).toHaveBeenCalled());
  expect(create.mock.calls[0]?.[0].type).toBe('application/pdf');
  expect(await screen.findByTitle('invoice.pdf')).toHaveAttribute(
    'src',
    'blob:http://localhost/preview',
  );
});

it('refuses to embed a PDF response that answers with an active document', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('<!doctype html><script>alert(1)</script>', {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    ),
  );
  const create = vi.fn(() => 'blob:http://localhost/preview');
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: create,
  });
  render(
    <FilePreviewDialog
      files={[
        record({
          filename: 'invoice.pdf',
          mimeType: 'application/pdf',
          contentUrl: '/main/uploads/invoices/test.pdf',
        }),
      ]}
      open
      onOpenChange={() => undefined}
    />,
  );
  await screen.findByRole('alert');
  expect(screen.getByRole('alert')).toHaveTextContent(
    'The file URL returned HTML or XML instead of a PDF.',
  );
  expect(create).not.toHaveBeenCalled();
  expect(screen.queryByTitle('invoice.pdf')).toBeNull();
});
