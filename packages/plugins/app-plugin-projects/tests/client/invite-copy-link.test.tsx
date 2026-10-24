import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { clientMocks, toasts } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());

const { InviteResults } =
  await import('../../client/pages/config/members/invite-dialog.js');

const url = 'https://example.test/invite/new-token';
const results = [
  {
    email: 'ann@example.com',
    outcome: 'invited' as const,
    emailSent: false,
    inviteUrl: url,
  },
];

beforeEach(() => {
  userEvent.setup();
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function copyLink(): Promise<void> {
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'invitations.copyLink' }),
    );
  });
}

it('copies the invitation and resets its feedback after two seconds', async () => {
  render(<InviteResults results={results} />);
  await copyLink();
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url);
  expect(
    screen.getByRole('button', { name: 'connect.copied' }),
  ).toBeInTheDocument();
  await act(() => vi.advanceTimersByTime(2000));
  expect(
    screen.getByRole('button', { name: 'invitations.copyLink' }),
  ).toBeInTheDocument();
});

it('cancels copied feedback when the invitation results unmount', async () => {
  const { unmount } = render(<InviteResults results={results} />);
  await copyLink();
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('does not schedule feedback when a pending clipboard write finishes after unmount', async () => {
  let finishCopy!: () => void;
  vi.spyOn(navigator.clipboard, 'writeText').mockReturnValue(
    new Promise<void>((resolve) => {
      finishCopy = resolve;
    }),
  );
  const { unmount } = render(<InviteResults results={results} />);
  await copyLink();
  unmount();
  await act(async () => finishCopy());
  expect(vi.getTimerCount()).toBe(0);
});

it('reports failure without copied feedback when both clipboard methods are unavailable', async () => {
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Denied'));
  const previous = Object.getOwnPropertyDescriptor(document, 'execCommand');
  Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false });
  toasts.length = 0;
  try {
    render(<InviteResults results={results} />);
    await copyLink();
    expect(screen.getByRole('button', { name: 'invitations.copyLink' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'connect.copied' })).toBeNull();
    expect(toasts).toContainEqual(expect.objectContaining({ type: 'error', title: 'connect.copyFailed' }));
    expect(document.querySelector('textarea')).toBeNull();
  } finally {
    if (previous) Object.defineProperty(document, 'execCommand', previous);
    else Reflect.deleteProperty(document, 'execCommand');
  }
});
