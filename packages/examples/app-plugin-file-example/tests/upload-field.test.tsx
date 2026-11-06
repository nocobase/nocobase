import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ClientFileRepository } from '@nocobase/app-plugin-file/client';
import { afterEach, expect, it, vi } from 'vitest';
import {
  FileUploadField,
  type FileUploadLabels,
} from '../client/components/file-upload-field.js';

const labels: FileUploadLabels = {
  choose: 'Choose files',
  dropHint: 'or drop files here',
  uploading: 'Uploading…',
  tooLarge: 'File exceeds the maximum size',
  rejected: 'File type is not allowed',
  uploadFailed: 'Upload failed',
  cancel: 'Cancel upload',
  retry: 'Retry upload',
  longWait: 'Still uploading. Keep waiting or cancel.',
};

afterEach(() => vi.useRealTimers());

it('keeps the upload button named while busy and explains a long upload', async () => {
  let signal: AbortSignal | undefined;
  const uploadOne = vi.fn(
    (_input: unknown, options?: { signal?: AbortSignal }) => {
      signal = options?.signal;
      return new Promise<never>(() => undefined);
    },
  );
  const repository = { uploadOne } as unknown as ClientFileRepository;
  vi.useFakeTimers();
  const view = render(
    <FileUploadField
      repository={repository}
      labels={labels}
      onChange={() => undefined}
    />,
  );
  fireEvent.change(
    screen.getByLabelText('Choose files', { selector: 'input' }),
    {
      target: { files: [new File(['x'], 'a.txt')] },
    },
  );
  await act(() => vi.advanceTimersByTimeAsync(0));
  // Before the display delay the button keeps its idle name.
  expect(screen.getByRole('button', { name: 'Choose files' })).toBeDisabled();
  await act(() => vi.advanceTimersByTimeAsync(300));
  expect(screen.getByRole('button', { name: 'Uploading…' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Uploading…');
  await act(() => vi.advanceTimersByTimeAsync(9700));
  expect(screen.getByRole('status')).toHaveTextContent(labels.longWait);
  expect(screen.getByRole('button', { name: 'Uploading…' })).toBeDisabled();
  // Cancelling really aborts the request and restores the named control.
  fireEvent.click(screen.getByRole('button', { name: 'Cancel upload' }));
  expect(signal?.aborted).toBe(true);
  expect(screen.getByRole('button', { name: 'Choose files' })).toBeEnabled();
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
