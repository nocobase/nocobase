import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDesignComposerActions } from '../../client/agents/design/composer-actions.js';
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
  proposal: {
    commentId: 'proposal',
    content: '# Plan',
    authorType: 'agent',
    authorId: 'designer',
    authorName: 'Designer',
    createdAt: '2026-10-11T00:00:00.000Z',
  },
  canApprove: true,
  canRequestChanges: true,
  executorOk: false,
  recommendedAgentId: developer.id,
  executorCandidates: [developer],
};
const issue = { id: 'issue', revision: 1 } as IssueDetail;

/** The comment box's buttons, run with a fixed draft; what each answered is shown beside them. */
function Box() {
  const { actions, dialog } = useDesignComposerActions(issue);
  const [answers, setAnswers] = useState<string[]>([]);
  return (
    <>
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() =>
            void action
              .onRun('Looks good')
              .then((cleared) =>
                setAnswers((list) => [...list, `${action.key}:${cleared}`]),
              )
          }
        >
          {action.label}
        </button>
      ))}
      <output>{answers.join(',')}</output>
      {dialog}
    </>
  );
}

async function mount(initial: DesignState = state) {
  const handler = vi.fn(async ({ method }: { method: string }) => ({
    data:
      method === 'POST'
        ? {
            ...initial,
            inReview: false,
            canApprove: false,
            statusKey: 'in_progress',
          }
        : initial,
  }));
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  await renderWithApp(
    <QueryClientProvider client={query}>
      <Box />
    </QueryClientProvider>,
    {
      namespace: '@nocobase/studio',
      namespaces: { '@nocobase/studio': locales },
      fetch: answerApi(handler),
    },
  );
  return handler;
}

describe('the comment box approval', () => {
  it('asks for a developer in the card dialog, then approves with the draft and clears the box', async () => {
    const handler = await mount();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Approve proposal' }),
    );
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
            comment: 'Looks good',
          },
        }),
      ),
    );
    expect(await screen.findByText('approve:true')).toBeInTheDocument();
  });

  it('keeps the draft when the developer dialog is dismissed', async () => {
    const handler = await mount();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Approve proposal' }),
    );
    const cancel = await screen.findByRole('button', { name: 'Cancel' });
    await waitFor(() => expect(cancel).toBeEnabled());
    fireEvent.click(cancel);
    expect(await screen.findByText('approve:false')).toBeInTheDocument();
    expect(handler).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('approves at once when the issue already has an executor who can implement it', async () => {
    const handler = await mount({ ...state, executorOk: true });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Approve proposal' }),
    );
    expect(await screen.findByText('approve:true')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        json: { comment: 'Looks good' },
      }),
    );
  });
});
