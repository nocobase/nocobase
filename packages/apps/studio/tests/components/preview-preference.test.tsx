import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
const error = vi.fn();
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({ request }),
}));
vi.mock('@nocobase/i18n/client', async (original) => ({
  ...(await original<typeof import('@nocobase/i18n/client')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../client/access/notify.js', () => ({
  useNotify: () => ({ success: vi.fn(), error }),
}));
const { PreviewPreferenceField } =
  await import('../../client/previews/preference-field.js');
const data = {
  issueId: 'one',
  identifier: 'T-1',
  previews: [],
  labels: [],
  notRequired: false,
  blocker: null,
  canEdit: true,
  canSetEnvironmentVariables: false,
};
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <PreviewPreferenceField issueId='one' />
    </QueryClientProvider>,
  );
  return client;
}
beforeEach(() => {
  request.mockReset();
  error.mockReset();
});
afterEach(cleanup);
describe('the preview preference field', () => {
  it('saves once, disables while pending and updates after success', async () => {
    let resolve!: (value: unknown) => void;
    request.mockResolvedValueOnce({ data }).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const client = mount();
    const toggle = await screen.findByRole('switch');
    await waitFor(() =>
      expect(toggle).not.toHaveAttribute('aria-disabled', 'true'),
    );
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(toggle).toHaveAttribute('aria-disabled', 'true'),
    );
    fireEvent.click(toggle);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: 'previews/preference',
        json: { issueId: 'one', notRequired: true },
      }),
    );
    resolve({ data: { ...data, notRequired: true } });
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
    expect(request).toHaveBeenCalledTimes(2);
    client.clear();
  });
  it('keeps the previous value and reports a failed save', async () => {
    request
      .mockResolvedValueOnce({ data })
      .mockRejectedValueOnce(new Error('Offline'));
    const client = mount();
    const toggle = await screen.findByRole('switch');
    await waitFor(() =>
      expect(toggle).not.toHaveAttribute('aria-disabled', 'true'),
    );
    fireEvent.click(toggle);
    await waitFor(() => expect(error).toHaveBeenCalledOnce());
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    client.clear();
  });
  it('shows read-only preference and label synchronization failure', async () => {
    request.mockResolvedValue({
      data: {
        ...data,
        canEdit: false,
        notRequired: true,
        labels: [
          { pullRequestId: 'pr', failed: true, present: null, managed: false },
        ],
      },
    });
    const client = mount();
    expect(await screen.findByText('previews.preference.on')).toBeVisible();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(
      'previews.preference.syncFailed',
    );
    client.clear();
  });
});
