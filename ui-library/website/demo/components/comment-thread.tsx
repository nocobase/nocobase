import { useState, type ReactElement } from 'react';

import {
  CommentComposer,
  CommentTimeline,
  TimelineActivity,
  type CommentItem,
  type CommentTimelineEntry,
} from '@/components/comment-thread';
import { MarkdownView } from '@/components/markdown-view';

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const comment = (
  id: string,
  authorName: string,
  content: string,
  minutes: number,
  extra: Partial<CommentItem> = {},
): CommentItem => ({
  id,
  authorName,
  authorKind: 'user',
  content,
  createdAt: ago(minutes),
  canEdit: true,
  canDelete: true,
  reactions: [],
  ...extra,
});

export function CommentThreadDemo(): ReactElement {
  const [replying, setReplying] = useState<CommentItem | null>(null);
  const [extra, setExtra] = useState<readonly CommentTimelineEntry[]>([]);
  const entries: readonly CommentTimelineEntry[] = [
    {
      kind: 'custom',
      key: 'a1',
      node: (
        <TimelineActivity
          actorName='Ada Lovelace'
          actorKind='user'
          at={ago(90)}
        >
          <span>moved it to In progress</span>
        </TimelineActivity>
      ),
    },
    {
      kind: 'thread',
      key: 't1',
      thread: {
        root: comment(
          'c1',
          'Ada Lovelace',
          'Can we **drop** the old export?',
          60,
          {
            reactions: [
              { emoji: '👍', count: 2, names: ['Grace', 'Alan'], mine: true },
            ],
          },
        ),
        replies: [
          comment('c2', 'Code Agent', 'Yes, nothing reads it.', 50, {
            authorKind: 'agent',
            tags: [{ key: 'kind', label: 'Agent', tone: 'violet' }],
          }),
        ],
      },
    },
    {
      kind: 'thread',
      key: 't2',
      thread: {
        root: comment('c3', 'Grace Hopper', 'Fixed the flaky test.', 30),
        replies: [],
        resolved: true,
        resolvedBy: 'Grace Hopper',
      },
    },
    ...extra,
  ];
  return (
    <div className='max-w-3xl space-y-6 p-6'>
      <CommentTimeline
        entries={entries}
        renderMarkdown={(content) => <MarkdownView content={content} />}
        onReply={setReplying}
        replyingToId={replying?.id ?? null}
        onEdit={() => Promise.resolve()}
        onDelete={() => Promise.resolve()}
        onResolve={() => Promise.resolve()}
        onReact={() => undefined}
        hasOlder
        onLoadOlder={() => undefined}
      />
      <CommentComposer
        replyingTo={replying?.authorName ?? null}
        onCancelReply={() => setReplying(null)}
        modes={[
          { value: 'comment', label: 'Comment' },
          { value: 'note', label: 'Note', send: 'Add note' },
        ]}
        onAttach={() => undefined}
        onSubmit={(content) => {
          const id = `n${extra.length}`;
          setExtra((current) => [
            ...current,
            {
              kind: 'thread',
              key: `t${current.length + 3}`,
              thread: {
                root: comment(id, 'You', content, 0),
                replies: [],
              },
            },
          ]);
          setReplying(null);
          return Promise.resolve(id);
        }}
      />
    </div>
  );
}
