import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClientError } from '@nocobase/app-client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import enUS from '../../client/locales/en-US.ts';
import { MemberActions } from '../../client/pages/config/members/member-roles-panel.tsx';
import ResetPasswordDialog from '../../client/pages/config/members/reset-password-dialog.tsx';

const state = vi.hoisted(() => ({
  allowed: true,
  viewerId: 'root',
  members: [{ userId: 'member', name: 'Sam', email: 'sam@example.com' }],
  reset: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: state.allowed, isPending: false }),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@nocobase/app-plugin-projects/client/kit')
  >()),
  useViewer: () => ({ userId: state.viewerId }),
}));
vi.mock('@nocobase/app-client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@nocobase/app-client')>()),
  useApiClient: () => ({}),
}));
vi.mock('@nocobase/app-plugin-users/client/user-client', () => ({
  UsersClient: class {
    resetPassword = state.reset;
  },
}));
vi.mock('../../client/access/api.js', () => ({
  studioKeys: { members: ['studio', 'members'] },
  useStudioApi: () => ({ members: () => Promise.resolve(state.members) }),
}));
vi.mock('../../client/access/notify.js', () => ({
  useNotify: () => ({ success: state.success }),
}));
vi.mock('../../client/components/route-dialog.js', () => ({
  RouteDialog: ({
    title,
    description,
    children,
    footer,
    beforeClose,
  }: {
    title: string;
    description?: string;
    children: ReactNode;
    footer: ReactNode;
    beforeClose?: () => boolean;
  }) => {
    const [blocked, setBlocked] = React.useState(false);
    return (
      <section role='dialog' aria-label={title}>
        {description ? <p>{description}</p> : null}
        {children}
        {footer}
        <button
          aria-label='Close route'
          onClick={() => setBlocked(beforeClose ? !beforeClose() : false)}
        />
        {blocked ? <span>Close blocked</span> : null}
      </section>
    );
  },
}));

const runtime = await createTestI18nRuntime({
  application: { namespace: 'app', resources: enUS },
});

function renderDialog(userId = 'member') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <TestI18nProvider runtime={runtime}>
      <QueryClientProvider client={client}>
        <MemoryRouter
          initialEntries={[`/config/members/${userId}/reset-password`]}
        >
          <Routes>
            <Route
              element={<ResetPasswordDialog />}
              path='/config/members/:userId/reset-password'
            />
            <Route element={<p>Members route</p>} path='/config/members' />
            <Route element={<p>Account route</p>} path='/account' />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </TestI18nProvider>,
  );
}

describe('member password reset', () => {
  beforeEach(() => {
    state.allowed = true;
    state.viewerId = 'root';
    state.members = [
      { userId: 'member', name: 'Sam', email: 'sam@example.com' },
    ];
    state.reset.mockReset().mockResolvedValue(undefined);
    state.success.mockReset();
  });

  it('shows the row action only for an authorized target and never for the current user', () => {
    const member = {
      userId: 'member',
      name: 'Sam',
      email: 'sam@example.com',
      roles: [],
    };
    const renderAction = (allowed: boolean, viewerId = 'root') => {
      state.allowed = allowed;
      return render(
        <TestI18nProvider runtime={runtime}>
          <MemoryRouter>
            <MemberActions member={member} viewerId={viewerId} />
          </MemoryRouter>
        </TestI18nProvider>,
      );
    };
    const allowed = renderAction(true);
    expect(
      screen.getByRole('button', { name: 'Member actions' }),
    ).toBeVisible();
    allowed.unmount();
    const denied = renderAction(false);
    expect(
      screen.queryByRole('button', { name: 'Member actions' }),
    ).not.toBeInTheDocument();
    denied.unmount();
    state.allowed = true;
    renderAction(true, 'member');
    expect(
      screen.queryByRole('button', { name: 'Member actions' }),
    ).not.toBeInTheDocument();
  });

  it('does not render a reset form for a denied or self route', () => {
    state.allowed = false;
    const denied = renderDialog();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
    denied.unmount();

    state.viewerId = 'member';
    renderDialog();
    expect(
      screen.getByText('Change your own password from your profile.'),
    ).toBeVisible();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  it('validates required and matching passwords before sending', async () => {
    renderDialog();
    await screen.findByLabelText('New password');
    fireEvent.submit(document.getElementById('reset-member-password')!);
    expect(await screen.findByText('Enter a new password.')).toBeVisible();
    expect(state.reset).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'different' },
    });
    fireEvent.submit(document.getElementById('reset-member-password')!);
    expect(await screen.findByText("Passwords don't match.")).toBeVisible();
    expect(state.reset).not.toHaveBeenCalled();
  });

  it('resets the target password, notifies on success, and closes the route', async () => {
    renderDialog();
    fireEvent.change(await screen.findByLabelText('New password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    await waitFor(() =>
      expect(state.reset).toHaveBeenCalledWith('member', 'password123'),
    );
    expect(state.success).toHaveBeenCalled();
    expect(await screen.findByText('Members route')).toBeVisible();
  });

  it('reports a missing target instead of leaving the dialog in a loading state', async () => {
    state.members = [];
    renderDialog();
    expect(
      await screen.findByText('This member could not be found.'),
    ).toBeVisible();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  it('prevents duplicate submission and closing while a reset is pending', async () => {
    let finish!: () => void;
    state.reset.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );
    renderDialog();
    fireEvent.change(await screen.findByLabelText('New password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
    const submit = await screen.findByRole('button', {
      name: 'Resetting password…',
    });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    fireEvent.click(screen.getByRole('button', { name: 'Close route' }));
    expect(screen.getByText('Close blocked')).toBeVisible();
    expect(state.reset).toHaveBeenCalledTimes(1);
    finish();
    await screen.findByText('Members route');
  });

  it.each([
    [
      400,
      'PASSWORD_TOO_SHORT',
      'This password is too short. Use a longer password.',
    ],
    [
      400,
      'PASSWORD_TOO_LONG',
      'This password is too long. Use a shorter password.',
    ],
    [403, undefined, 'You do not have permission to do this.'],
    [404, undefined, 'This member could not be found.'],
    [500, undefined, 'The request failed. Please try again.'],
  ])(
    'shows a clear error for server status %s and reason %s',
    async (status, reason, message) => {
      state.reset.mockRejectedValue(
        new ApiClientError('request failed', {
          status: Number(status),
          reason: typeof reason === 'string' ? reason : undefined,
          method: 'POST',
          url: '/api/users/member/resetPassword',
        }),
      );
      renderDialog();
      fireEvent.change(await screen.findByLabelText('New password'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText('Confirm new password'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));
      expect(await screen.findByText(message)).toBeVisible();
      expect(screen.getByLabelText('New password')).toBeInTheDocument();
    },
  );
});
