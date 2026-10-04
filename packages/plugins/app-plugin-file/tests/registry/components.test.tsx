import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import {
  ClientFileRepositoryManager,
  type FileRecord,
} from '../../client/index.js';
import { createApiClient } from '@nocobase/api-client';
import {
  FileUploadField,
  FileList,
  FilePreviewDialog,
  FileThumbnail,
} from '../../registry/component-ui/index';

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
