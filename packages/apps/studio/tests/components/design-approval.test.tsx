import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import userEvent from '@testing-library/user-event';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDesignApproval } from '../../client/agents/design/approval.js';
import type { DesignState } from '../../shared/design.js';
import locales from '../../client/locales/index.js';

const developer = {
  type: 'agent' as const,
  id: 'studio-senior-developer',
  name: 'Senior developer',
};
const state: DesignState = {
  issueId: 'issue',
  statusKey: 'proposal_review',
  inReview: true,
  proposal: null,
  canApprove: true,
  canRequestChanges: true,
  executorOk: false,
  recommendedAgentId: developer.id,
  executorCandidates: [
    developer,
    { type: 'user', id: 'member', name: 'Member' },
  ],
};
function View({ initial = state }: { initial?: DesignState }) {
  const [external, setExternal] = useState(initial);
  const approval = useDesignApproval('issue', external, () => undefined);
  const shown = approval.latest ?? external;
  return (
    <>
      {shown.canApprove ? (
        <button
          disabled={approval.pending}
          onClick={() => approval.approve('Approved')}
        >
          Approve
        </button>
      ) : null}
      <button onClick={() => setExternal({ ...state })}>
        Refresh proposal
      </button>
      {approval.dialog}
    </>
  );
}
async function mount(
  handler: Parameters<typeof answerApi>[0],
  initial = state,
) {
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return renderWithApp(
    <QueryClientProvider client={query}>
      <View initial={initial} />
    </QueryClientProvider>,
    {
      namespace: '@nocobase/studio',
      namespaces: { '@nocobase/studio': locales },
      fetch: answerApi(handler),
    },
  );
}

describe('shared design approval interaction', () => {
  it('uses an eligible recommendation and submits selection and comment together', async () => {
    const handler = vi.fn(async ({ method }: { method: string }) => ({
      data:
        method === 'POST'
          ? { ...state, canApprove: false, statusKey: 'in_progress' }
          : state,
    }));
    await mount(handler);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const confirm = await screen.findByRole('button', {
      name: 'Approve and enter development',
    });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          json: {
            executor: { type: 'agent', id: developer.id },
            comment: 'Approved',
          },
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('searches grouped candidates and submits a selected person', async () => {
    const handler = vi.fn(async ({ method }: { method: string }) => ({
      data:
        method === 'POST'
          ? { ...state, canApprove: false, statusKey: 'in_progress' }
          : state,
    }));
    await mount(handler);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const confirm = await screen.findByRole('button', {
      name: 'Approve and enter development',
    });
    await waitFor(() => expect(confirm).toBeEnabled());
    const input = screen.getByRole('combobox');
    const user = userEvent.setup();
    await user.click(input);
    await user.clear(input);
    await user.type(input, 'Member');
    fireEvent.click(await screen.findByRole('option', { name: /Member/ }));
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          json: {
            executor: { type: 'user', id: 'member' },
            comment: 'Approved',
          },
        }),
      ),
    );
  });
  it('cancels without saving and refuses an empty candidate list', async () => {
    const handler = vi.fn(async () => ({
      data: { ...state, executorCandidates: [] },
    }));
    await mount(handler);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await screen.findByText(
      'No developer agents or project members are available. Ask the owner to adjust access.',
    );
    expect(
      screen.getByRole('button', { name: 'Approve and enter development' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handler.mock.calls).toHaveLength(1);
  });

  it('recovers from a direct approval conflict without automatically approving again', async () => {
    const handler = vi.fn(async ({ method }: { method: string }) =>
      method === 'POST'
        ? Response.json(
            {
              error: {
                code: 409,
                status: 'ABORTED',
                reason: 'DESIGN_EXECUTOR_REQUIRED',
                domain: 'nb-studio',
                message: 'Choose an executor',
              },
            },
            { status: 409 },
          )
        : { data: state },
    );
    await mount(handler, { ...state, executorOk: true });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await screen.findByText(
      'The executor changed. Choose an executor before approving.',
    );
    expect(
      handler.mock.calls.filter(([call]) => call.method === 'POST'),
    ).toHaveLength(1);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

it('keeps an eligible selection after a service failure and retries only when requested', async () => {
  let posts = 0;
  const handler = vi.fn(async ({ method }: { method: string }) => {
    if (method === 'POST' && ++posts === 1)
      return Response.json(
        {
          error: {
            code: 500,
            status: 'INTERNAL',
            reason: 'INTERNAL',
            domain: 'nb-studio',
            message: 'Try later',
          },
        },
        { status: 500 },
      );
    return {
      data:
        method === 'POST'
          ? { ...state, canApprove: false, statusKey: 'in_progress' }
          : state,
    };
  });
  await mount(handler);
  fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
  const confirm = await screen.findByRole('button', {
    name: 'Approve and enter development',
  });
  await waitFor(() => expect(confirm).toBeEnabled());
  fireEvent.click(confirm);
  await screen.findByRole('alert');
  await waitFor(() => expect(confirm).toBeEnabled());
  expect(screen.getByRole('combobox')).toHaveValue('Senior developer');
  expect(posts).toBe(1);
  fireEvent.click(confirm);
  await waitFor(() =>
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
  );
  expect(posts).toBe(2);
});

describe('approval freshness and revoked access', () => {
  it('re-enables approval after a later external proposal refresh', async () => {
    const handler = async ({ method }: { method: string }) => ({
      data:
        method === 'POST'
          ? { ...state, canApprove: false, statusKey: 'in_progress' }
          : state,
    });
    await mount(handler);
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const confirm = await screen.findByRole('button', {
      name: 'Approve and enter development',
    });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Approve', exact: true }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Refresh proposal' }));
    await screen.findByRole('button', { name: 'Approve', exact: true });
  });

  it('keeps revoked approval disabled after closing the dialog', async () => {
    await mount(async () =>
      Response.json(
        {
          error: {
            code: 403,
            status: 'PERMISSION_DENIED',
            reason: 'FORBIDDEN',
            domain: 'nb-studio',
            message: 'revoked',
          },
        },
        { status: 403 },
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await screen.findByText(
      'Approval access was revoked. Close this dialog and ask the owner to restore access.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByRole('button', { name: 'Approve', exact: true }),
    ).not.toBeInTheDocument();
  });

  it('clears a revoked candidate, associates the field error and focuses selection', async () => {
    let invalid = false;
    await mount(async ({ method }) => {
      if (method === 'POST') {
        invalid = true;
        return Response.json(
          {
            error: {
              code: 400,
              status: 'INVALID_ARGUMENT',
              reason: 'DESIGN_EXECUTOR_INVALID',
              domain: 'nb-studio',
              message: 'invalid',
            },
          },
          { status: 400 },
        );
      }
      return {
        data: invalid
          ? { ...state, executorCandidates: [state.executorCandidates[1]!] }
          : state,
      };
    });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    const confirm = await screen.findByRole('button', {
      name: 'Approve and enter development',
    });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    const input = screen.getByRole('combobox');
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(input).toHaveFocus());
    expect(confirm).toBeDisabled();
  });
});
