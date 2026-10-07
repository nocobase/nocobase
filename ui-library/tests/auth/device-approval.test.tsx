import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeviceApproval } from '../../registry/auth/device-approval/device-approval';
import { formatUserCode } from '../../registry/auth/device-approval/use-device-approval';
import enUS from '../../registry/auth/device-approval/locales/en-US';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ client: { $fetch: mocks.fetch } }),
}));

afterEach(() => mocks.fetch.mockReset());

const runtime = await createTestI18nRuntime({
  application: { namespace: '@nocobase/test-app', resources: enUS },
});

function Page({ initial }: { readonly initial?: string }): ReactElement {
  const [code, setCode] = useState(initial ?? '');
  return (
    <TestI18nProvider runtime={runtime}>
      <DeviceApproval onUserCodeChange={setCode} userCode={code} />
    </TestI18nProvider>
  );
}

const pending = {
  data: { status: 'pending', client_id: 'acme' },
  error: null,
};

describe('DeviceApproval', () => {
  it('formats a code the way the device shows it', () => {
    expect(formatUserCode('abcd2345')).toBe('ABCD-2345');
    expect(formatUserCode('ab-cd')).toBe('ABCD');
  });

  it('asks for the code when the address has none, then checks it', async () => {
    mocks.fetch.mockResolvedValue(pending);
    render(<Page />);
    fireEvent.change(screen.getByLabelText('Code'), {
      target: { value: 'abcd2345' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Requested by acme')).toBeVisible();
    expect(mocks.fetch).toHaveBeenCalledWith('/device', {
      method: 'GET',
      query: { user_code: 'ABCD-2345' },
    });
  });

  it('checks a code once, even under StrictMode, and approves it', async () => {
    mocks.fetch.mockResolvedValueOnce(pending);
    mocks.fetch.mockResolvedValueOnce({ data: { success: true }, error: null });
    render(
      <StrictMode>
        <Page initial='ABCD-2345' />
      </StrictMode>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Return to your terminal',
    );
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.fetch).toHaveBeenLastCalledWith('/device/approve', {
      method: 'POST',
      body: { userCode: 'ABCD-2345' },
    });
  });

  it('denies a code', async () => {
    mocks.fetch.mockResolvedValueOnce(pending);
    mocks.fetch.mockResolvedValueOnce({ data: { success: true }, error: null });
    render(<Page initial='ABCD-2345' />);
    fireEvent.click(await screen.findByRole('button', { name: 'Deny' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Request denied',
    );
    expect(mocks.fetch).toHaveBeenLastCalledWith('/device/deny', {
      method: 'POST',
      body: { userCode: 'ABCD-2345' },
    });
  });

  it('says when a code has expired or is not valid', async () => {
    mocks.fetch.mockResolvedValueOnce({
      data: null,
      error: { status: 400, error: 'expired_token' },
    });
    const { unmount } = render(<Page initial='ABCD-2345' />);
    expect(await screen.findByRole('alert')).toHaveTextContent('expired');
    unmount();

    mocks.fetch.mockResolvedValueOnce({
      data: null,
      error: { status: 400, error: 'invalid_request' },
    });
    render(<Page initial='ZZZZ-ZZZZ' />);
    expect(await screen.findByRole('alert')).toHaveTextContent('not valid');
    fireEvent.click(screen.getByRole('button', { name: 'Enter another code' }));
    expect(screen.getByLabelText('Code')).toBeVisible();
  });

  it('refuses a code another account has claimed, and retries after an error', async () => {
    mocks.fetch.mockResolvedValueOnce({
      data: { status: 'pending', user_code: 'ABCD2345' },
      error: null,
    });
    const { unmount } = render(<Page initial='ABCD-2345' />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'another account',
    );
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    unmount();

    mocks.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    mocks.fetch.mockResolvedValueOnce(pending);
    render(<Page initial='ABCD-2345' />);
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled(),
    );
  });
});
