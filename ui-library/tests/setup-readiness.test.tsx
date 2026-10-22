import {
  act,
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { useCallback } from 'react';
import { expect, it, vi } from 'vitest';
import {
  SetupReadiness,
  type SetupReadinessLabels,
} from '../registry/components/setup-readiness.js';
import {
  useSetupReadiness,
  setupInspectionFailure,
  type SetupCheck,
  type SetupInspections,
} from '../registry/components/setup-readiness-state.js';
const labels: SetupReadinessLabels = {
  title: 'Setup needed',
  checking: 'Checking…',
  ready: 'Ready',
  missing: 'Review missing items',
  checkAgain: 'Check again',
  unknown: {
    unavailable: 'Cannot check. Try again.',
    signIn: 'Sign in again.',
    forbidden: 'No access.',
    invalid: 'Ask the maintainer.',
  },
};
const checks: readonly SetupCheck[] = [
  {
    id: 'manager',
    title: 'Direct manager',
    description: 'Assign a manager to submit.',
    action: <a href='/settings/managers'>Configure manager</a>,
  },
];
function Probe({
  inspect,
  enabled = true,
  refreshKey = '',
}: {
  inspect: () => Promise<SetupInspections>;
  enabled?: boolean;
  refreshKey?: string;
}) {
  return (
    <SetupReadiness
      state={useSetupReadiness(checks, inspect, { enabled, refreshKey })}
      labels={labels}
    />
  );
}
function deferred() {
  let resolve!: (value: SetupInspections) => void;
  const promise = new Promise<SetupInspections>((done) => {
    resolve = done;
  });
  return { resolve, promise };
}
it('hides initial success and displays only actual missing checks', async () => {
  const inspect = vi.fn().mockResolvedValue({ manager: { status: 'ready' } });
  const view = render(<Probe inspect={inspect} />);
  expect(screen.getByText('Checking…')).toBeVisible();
  await waitFor(() => expect(view.container).toBeEmptyDOMElement());
  inspect.mockResolvedValue({ manager: { status: 'missing' } });
  fireEvent(window, new Event('focus'));
  expect(
    await screen.findByRole('link', { name: 'Configure manager' }),
  ).toBeVisible();
});
it('ignores old requests, hides stale links while rechecking and rechecks on host navigation', async () => {
  const first = deferred();
  const second = deferred();
  const inspect = vi
    .fn()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);
  const view = render(<Probe inspect={inspect} refreshKey='one' />);
  await waitFor(() => expect(inspect).toHaveBeenCalledTimes(1));
  view.rerender(<Probe inspect={inspect} refreshKey='two' />);
  await waitFor(() => expect(inspect).toHaveBeenCalledTimes(2));
  await act(async () => second.resolve({ manager: { status: 'missing' } }));
  expect(screen.getByRole('link')).toBeVisible();
  await act(async () => first.resolve({ manager: { status: 'ready' } }));
  expect(screen.getByRole('link')).toBeVisible();
  const pending = deferred();
  inspect.mockReturnValueOnce(pending.promise);
  fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  await act(async () => pending.resolve({ manager: { status: 'ready' } }));
  expect(screen.getByText('Ready')).toBeVisible();
  expect(screen.getByRole('button')).toBeEnabled();
});
it('does not inspect while disabled and does not reuse a pre-revocation success when re-enabled', async () => {
  const inspect = vi.fn().mockResolvedValue({ manager: { status: 'ready' } });
  const view = render(<Probe inspect={inspect} enabled={false} />);
  expect(inspect).not.toHaveBeenCalled();
  view.rerender(<Probe inspect={inspect} />);
  await waitFor(() => expect(inspect).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(view.container).toBeEmptyDOMElement());
  view.rerender(<Probe inspect={inspect} enabled={false} />);
  inspect.mockResolvedValue({ manager: { status: 'missing' } });
  view.rerender(<Probe inspect={inspect} />);
  expect(screen.getByText('Checking…')).toBeVisible();
  expect(await screen.findByRole('link')).toBeVisible();
});
it.each([
  [401, 'Sign in again.'],
  [403, 'No access.'],
  [404, 'Ask the maintainer.'],
  [500, 'Cannot check. Try again.'],
])(
  'does not call HTTP %s missing, leak server detail or offer a meaningless retry',
  async (status, message) => {
    const inspect = vi
      .fn()
      .mockRejectedValue({ status, message: 'private-detail' });
    render(<Probe inspect={inspect} />);
    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText('private-detail')).not.toBeInTheDocument();
    expect(Boolean(screen.queryByRole('button'))).toBe(status === 500);
  },
);
it('treats omitted results as unknown instead of ready and contains synchronous inspection failures', async () => {
  const inspect = vi.fn().mockImplementation(() => {
    throw new Error('private-detail');
  });
  const view = render(<Probe inspect={inspect} />);
  expect(await screen.findByText('Cannot check. Try again.')).toBeVisible();
  inspect.mockResolvedValue({});
  view.rerender(<Probe inspect={inspect} refreshKey='next' />);
  expect(await screen.findByText('Ask the maintainer.')).toBeVisible();
  expect(setupInspectionFailure({ status: 400 })).toEqual({
    status: 'unknown',
    reason: 'invalid',
  });
});
it('consumes an application-owned relationship inspection and rechecks after configuration changes', async () => {
  let missingManagerCount = 2;
  const read = vi.fn(async () => ({ missingManagerCount }));
  function RelationshipPage() {
    const inspect = useCallback(
      async () => ({
        manager: {
          status:
            (await read()).missingManagerCount > 0
              ? ('missing' as const)
              : ('ready' as const),
        },
      }),
      [],
    );
    return <Probe inspect={inspect} />;
  }
  render(<RelationshipPage />);
  expect(await screen.findByRole('link')).toBeVisible();
  missingManagerCount = 0;
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByText('Ready')).toBeVisible();
  expect(read).toHaveBeenCalledTimes(2);
});

it('hides disabled checks after manual confirmation and rejects malformed inspection payloads', async () => {
  const inspect = vi.fn().mockResolvedValue({ manager: { status: 'missing' } });
  const view = render(<Probe inspect={inspect} />);
  await screen.findByRole('link');
  inspect.mockResolvedValue(null);
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByText('Ask the maintainer.')).toBeVisible();
  view.rerender(<Probe inspect={inspect} enabled={false} />);
  expect(view.container).toBeEmptyDOMElement();
});
