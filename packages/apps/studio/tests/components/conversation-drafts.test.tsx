import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DraftContext,
  IssueDrafts,
} from '../../client/follow-ups/draft-state.js';
import { IssueConversation } from '../../client/issues/live/conversation.js';
import { useIssueConversation } from '../../client/issues/live/conversation-state.js';

const actions = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('@nocobase/app-plugin-projects/client/issues', () => ({
  canComment: () => true,
  useIssueCommentActions: () => actions,
  useKindLabel: () => (kind: string) => kind,
  useMentionSearch: () => vi.fn(),
}));
vi.mock('@nocobase/app-plugin-projects/client/kit', () => ({
  pmKeys: { project: (id: string) => ['project', id] },
  usePmApi: () => ({ project: vi.fn() }),
  useViewer: () => ({ userId: 'viewer' }),
}));
afterEach(cleanup);

function Reply() {
  const conversation = useIssueConversation();
  return (
    <>
      <output>{conversation.replyTo?.id ?? 'No reply'}</output>
      <output>
        {conversation.composerOpen ? 'Composer open' : 'Composer folded'}
      </output>
      <button
        onClick={() =>
          conversation.setReplyTo({
            id: `reply-${conversation.detail.id}`,
            authorName: 'Demo author',
          })
        }
      >
        Reply
      </button>
      <button onClick={conversation.openComposer}>Open composer</button>
    </>
  );
}
function Harness() {
  const [id, setId] = useState('A');
  return (
    <>
      <button onClick={() => setId(id === 'A' ? 'B' : 'A')}>Switch task</button>
      <IssueConversation
        detail={{ id, projectId: null } as IssueDetail}
        detailKey={['issue', id]}
      >
        <Reply />
      </IssueConversation>
    </>
  );
}

describe('merged conversation draft lifecycle', () => {
  it('retains the lightweight reply target and composer state per task and holds reply changes during submission', () => {
    const drafts = new IssueDrafts();
    drafts.ensure('A');
    drafts.ensure('B');
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DraftContext.Provider value={drafts}>
          <Harness />
        </DraftContext.Provider>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open composer' }));
    expect(screen.getByText('reply-A')).toBeVisible();
    expect(screen.getByText('Composer open')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Switch task' }));
    expect(screen.getByText('No reply')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Switch task' }));
    expect(screen.getByText('reply-A')).toBeVisible();
    expect(screen.getByText('Composer open')).toBeVisible();
    act(() => {
      drafts.sessions.get('A')!.setter('pending', false)(true);
      drafts.sessions.get('A')!.setter('replyTo', null as unknown)({
        id: 'captured-reply',
        authorName: 'Demo author',
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    expect(screen.getByText('captured-reply')).toBeVisible();
    expect(actions.create).not.toHaveBeenCalled();
  });
});
