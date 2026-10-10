import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  IssueDependencies,
  type DependencyItem,
} from '../../client/extensions/nocobase-issue-detail/issue-detail.js';

const other: DependencyItem = {
  id: 'link',
  issueId: 'b',
  identifier: 'PM-2',
  title: 'Other issue',
  href: '/issues/b',
  status: { name: 'Todo', color: 'gray' },
};
const candidate = { id: 'b', identifier: 'PM-2', title: 'Other issue' };

it.each(['blockedBy', 'relatedTo'] as const)(
  'adds a %s relationship using the selected type',
  async (type) => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(
      <IssueDependencies
        blockedBy={[]}
        blocks={[]}
        related={[]}
        adding
        onAdd={onAdd}
        onSearch={() => Promise.resolve([candidate])}
      />,
    );
    expect(screen.getByText(/Related issues do not block/)).toBeVisible();
    if (type === 'relatedTo') {
      await user.click(
        screen.getByRole('combobox', { name: 'Relationship type' }),
      );
      await user.click(await screen.findByRole('option', { name: 'Related' }));
    }
    const search = screen.getByRole('combobox', { name: 'Add a relationship' });
    await user.click(search);
    await user.type(search, 'Other');
    await user.click(
      await screen.findByRole('option', { name: /Other issue/ }),
    );
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledExactlyOnceWith(candidate, type),
    );
  },
);

describe('existing relationships', () => {
  it.each(['blockedBy', 'relatedTo'] as const)(
    'switches %s through its row action',
    async (type) => {
      const user = userEvent.setup();
      const onChangeType = vi.fn().mockResolvedValue(undefined);
      render(
        <IssueDependencies
          blockedBy={type === 'blockedBy' ? [other] : []}
          blocks={[]}
          related={type === 'relatedTo' ? [other] : []}
          onAdd={vi.fn()}
          onChangeType={onChangeType}
          onSearch={() => Promise.resolve([])}
        />,
      );
      await user.click(
        screen.getByRole('button', { name: 'Change relationship with PM-2' }),
      );
      await user.click(
        await screen.findByRole('menuitem', {
          name:
            type === 'blockedBy'
              ? 'Change to related'
              : 'Make a prerequisite (this issue waits)',
        }),
      );
      await waitFor(() =>
        expect(onChangeType).toHaveBeenCalledExactlyOnceWith(
          other,
          type === 'blockedBy' ? 'relatedTo' : 'blockedBy',
        ),
      );
    },
  );

  it('removes related links and keeps all controls disabled until the request settles, then allows retry', async () => {
    let fail!: (error: Error) => void;
    const onRemove = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          fail = reject;
        }),
    );
    render(
      <IssueDependencies
        blockedBy={[]}
        blocks={[]}
        related={[other]}
        onAdd={vi.fn()}
        onChangeType={vi.fn()}
        onRemove={onRemove}
        onSearch={() => Promise.resolve([])}
      />,
    );
    const remove = screen.getByRole('button', { name: 'Remove PM-2' });
    fireEvent.click(remove);
    fireEvent.click(remove);
    await waitFor(() =>
      expect(onRemove).toHaveBeenCalledExactlyOnceWith(other),
    );
    expect(remove).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Relationship type' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Change relationship with PM-2' }),
    ).toBeDisabled();
    fail(new Error('Failed to remove'));
    await waitFor(() => expect(remove).toBeEnabled());
    expect(screen.getByRole('link', { name: /Other issue/ })).toBeVisible();
  });

  it('hides editing actions for viewers and incoming blockers', () => {
    const { rerender } = render(
      <IssueDependencies
        blockedBy={[other]}
        blocks={[]}
        related={[{ ...other, id: 'related' }]}
        onChangeType={vi.fn()}
        onRemove={vi.fn()}
        onSearch={() => Promise.resolve([])}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Change relationship|Remove/ }),
    ).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    rerender(
      <IssueDependencies
        blockedBy={[]}
        blocks={[other]}
        related={[]}
        onAdd={vi.fn()}
        onChangeType={vi.fn()}
        onRemove={vi.fn()}
        onSearch={() => Promise.resolve([])}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Change relationship|Remove/ }),
    ).toBeNull();
  });

  it('excludes self and existing links of the selected type from search', async () => {
    const user = userEvent.setup();
    render(
      <IssueDependencies
        blockedBy={[]}
        blocks={[]}
        related={[other]}
        excludeIds={['self']}
        onAdd={vi.fn()}
        onSearch={() =>
          Promise.resolve([
            candidate,
            { id: 'self', identifier: 'PM-1', title: 'This issue' },
          ])
        }
      />,
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Relationship type' }),
    );
    await user.click(await screen.findByRole('option', { name: 'Related' }));
    const search = screen.getByRole('combobox', { name: 'Add a relationship' });
    await user.click(search);
    await user.type(search, 'issue');
    await screen.findByText('No issues found');
    expect(screen.queryByRole('option', { name: /PM-1|PM-2/ })).toBeNull();
  });
});
