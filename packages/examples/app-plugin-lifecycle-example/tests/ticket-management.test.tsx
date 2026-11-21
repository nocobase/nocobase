import { renderWithApp } from '@nocobase/app-testing/client';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

import { TicketManagementDialog } from '../client/components/ticket-management.js';
import lifecycleExample from '../client/plugin.js';
import { NAMESPACE } from '../client/lib/format.js';

afterEach(cleanup);

it('keeps a submission id across transport failures and requires reviewing fresh data after a conflict', async () => {
  const submissions: unknown[] = [];
  const refresh = vi.fn(async () => {});
  const fetch = async (request: Request): Promise<Response> => {
    expect(new URL(request.url).pathname).toMatch(
      /\/lifecycleExample\/tickets\/1\/management$/,
    );
    submissions.push(await request.json());
    if (submissions.length === 1) throw new Error('Network unavailable');
    return Response.json(
      { error: { reason: 'CONFLICT', message: 'The ticket changed.' } },
      { status: 409 },
    );
  };
  await renderWithApp(
    <TicketManagementDialog
      id='1'
      subject='Shipping question'
      state='awaitingCustomer'
      management={{
        initial: 'new',
        version: 'displayed-version',
        actions: ['restartAt', 'reset', 'resume'],
        targets: ['open'],
        work: [{ id: '42', effect: 'notifyCustomer', status: 'running' }],
        history: [],
      }}
      refresh={refresh}
    />,
    { plugins: [lifecycleExample()], namespace: NAMESPACE, fetch },
  );
  const trigger = await screen.findByRole('button', {
    name: 'Manage lifecycle',
    expanded: false,
  });
  fireEvent.click(trigger);
  await screen.findByRole('dialog');
  expect(
    screen.getByText('notifyCustomer · In-flight work may complete'),
  ).toBeTruthy();
  const submit = screen.getByRole<HTMLButtonElement>('button', {
    name: 'Apply action',
  });
  expect(submit.disabled).toBe(true);
  fireEvent.change(screen.getByRole('textbox', { name: 'Reason' }), {
    target: { value: 'Reassign this ticket.' },
  });
  fireEvent.click(submit);
  await screen.findByRole('alert');
  await waitFor(() => expect(submit.disabled).toBe(false));
  fireEvent.click(submit);
  await screen.findByText(
    'The ticket changed. Close this dialog and review the latest state before submitting again.',
  );
  expect(submit.disabled).toBe(true);
  expect(refresh).toHaveBeenCalledOnce();
  expect(submissions).toEqual([
    {
      command: 'restartAt',
      target: 'open',
      reason: 'Reassign this ticket.',
      requestId: expect.any(String),
      expectedVersion: 'displayed-version',
    },
    submissions[0],
  ]);
});
