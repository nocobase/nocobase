import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  CommentComposer,
  CommentTimeline,
  type CommentItem,
  type CommentTimelineEntry,
} from '../../client/components/comment-thread';

const comment = (overrides: Partial<CommentItem> = {}): CommentItem => ({
  id: 'c1',
  authorName: 'Bob',
  authorKind: 'user',
  content: 'Looks good',
  createdAt: '2026-10-01T10:00:00.000Z',
  reactions: [],
  ...overrides,
});

const thread = (
  root: CommentItem,
  extra: Partial<
    Extract<CommentTimelineEntry, { kind: 'thread' }>['thread']
  > = {},
): CommentTimelineEntry => ({
  kind: 'thread',
  key: `thread:${root.id}`,
  thread: { root, replies: [], ...extra },
});

describe('CommentTimeline', () => {
  it('offers edit and delete only where the comment allows them', () => {
    render(
      <CommentTimeline
        entries={[
          thread(comment({ id: 'mine', canEdit: true, canDelete: true })),
          thread(comment({ id: 'theirs' })),
        ]}
        onEdit={() => Promise.resolve()}
        onDelete={() => Promise.resolve()}
      />,
    );
    const mine = document.querySelector('[data-comment-id="mine"]');
    const theirs = document.querySelector('[data-comment-id="theirs"]');
    expect(
      within(mine as HTMLElement).getByRole('button', { name: 'More actions' }),
    ).toBeTruthy();
    expect(
      within(theirs as HTMLElement).queryByRole('button', {
        name: 'More actions',
      }),
    ).toBeNull();
  });

  it('collapses a resolved thread and reopens it', async () => {
    const onResolve = vi.fn(() => Promise.resolve());
    render(
      <CommentTimeline
        entries={[thread(comment(), { resolved: true, resolvedBy: 'Ann' })]}
        onResolve={onResolve}
      />,
    );
    expect(screen.getByTestId('thread-resolved')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Show the thread by Bob' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(onResolve).toHaveBeenCalled());
    expect(onResolve.mock.calls[0]?.[1]).toBe(false);
  });

  it('shows a deleted comment as deleted, without its reactions', () => {
    render(
      <CommentTimeline
        entries={[
          thread(
            comment({
              deleted: true,
              reactions: [
                { emoji: '👍', count: 1, names: ['Ann'], mine: false },
              ],
            }),
          ),
        ]}
      />,
    );
    expect(screen.getByText('This comment was deleted.')).toBeTruthy();
    expect(screen.queryByText('👍')).toBeNull();
  });

  it('reacts with an emoji from the picker', async () => {
    const onReact = vi.fn();
    render(<CommentTimeline entries={[thread(comment())]} onReact={onReact} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a reaction' }));
    fireEvent.click(await screen.findByRole('button', { name: '🎉' }));
    expect(onReact).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'c1' }),
      '🎉',
    );
  });

  it('places the consumer’s own entries between threads', () => {
    render(
      <CommentTimeline
        entries={[
          { kind: 'custom', key: 'a1', node: <p>moved it to Done</p> },
          thread(comment()),
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.textContent).toContain('moved it to Done');
  });
});

describe('a long timeline', () => {
  it('renders only what is on screen past a hundred entries', () => {
    const entries: CommentTimelineEntry[] = Array.from(
      { length: 150 },
      (_, index) => ({
        kind: 'custom',
        key: `a${index}`,
        node: <p>change {index}</p>,
      }),
    );
    const { container } = render(<CommentTimeline entries={entries} />);
    expect(container.querySelector('[data-virtualized]')).not.toBeNull();
    expect(screen.queryByText('change 149')).toBeNull();
  });
});

describe('CommentComposer', () => {
  it('cannot send without text, and names the send button after the chosen mode', () => {
    render(
      <CommentComposer
        onSubmit={() => Promise.resolve('c9')}
        modes={[
          { value: 'comment', label: 'Comment' },
          { value: 'note', label: 'Note', send: 'Add note' },
        ]}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Comment' }).hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('tab', { name: 'Note' }));
    expect(screen.getByRole('button', { name: 'Add note' })).toBeTruthy();
  });

  it('offers decisions beside the send button, and holds one that needs a reason until something is written', async () => {
    const approve = vi.fn(() => Promise.resolve(true));
    const back = vi.fn(() => Promise.resolve(true));
    render(
      <CommentComposer
        onSubmit={() => Promise.resolve('c9')}
        actions={[
          { key: 'approve', label: 'Approve proposal', onRun: approve },
          {
            key: 'back',
            label: 'Send back',
            needsContent: true,
            onRun: back,
          },
          {
            key: 'off',
            label: 'Unavailable',
            disabled: true,
            onRun: back,
          },
        ]}
      />,
    );
    expect(
      screen
        .getByRole('button', { name: 'Send back' })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', { name: 'Unavailable' })
        .hasAttribute('disabled'),
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Approve proposal' }));
    await waitFor(() => expect(approve).toHaveBeenCalledWith(''));
    expect(back).not.toHaveBeenCalled();
  });
});
