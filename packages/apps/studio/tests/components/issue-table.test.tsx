import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  IssueTable,
  type IssueTableRow,
} from '../../client/components/issue-table.js';
import { issuesEnUS, issuesZhCN } from '../../client/issues/locales.js';

const root: IssueTableRow = {
  id: 'root',
  identifier: 'TASK-1',
  title: 'Parent',
  labels: [],
  status: null,
  priority: 'none',
  owner: null,
  executor: null,
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('issue table hierarchy', () => {
  it('defaults to zero depth and indents only the title, with the exact localized depth', () => {
    const { container } = render(
      <IssueTable
        rows={[root, { ...root, id: 'child', title: 'Child', depth: 20 }]}
        labels={issuesZhCN.table}
      />,
    );
    expect(container.querySelector('[data-issue-depth="0"]')).toContainElement(
      screen.getByText('Parent'),
    );
    const child = container.querySelector('[data-issue-depth="20"]');
    expect(child).toContainElement(screen.getByText('第 20 层'));
    expect(child).toHaveStyle({ paddingInlineStart: 'min(320px, 25cqw)' });
    expect(child).not.toContainElement(screen.getAllByText('TASK-1')[1]!);
  });

  it('opens plain links and rows while leaving modifier clicks to the browser', () => {
    const onRowClick = vi.fn();
    render(
      <IssueTable
        rows={[root]}
        rowHref={() => '/issues/root'}
        onRowClick={onRowClick}
        labels={issuesEnUS.table}
      />,
    );
    const link = screen.getByRole('link', { name: 'TASK-1' });
    expect(link).toHaveAttribute('href', '/issues/root');
    fireEvent.click(link);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { metaKey: true });
    expect(onRowClick).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Parent'));
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });

  it('keeps restore isolated from opening and provides the original sorts on narrow screens', () => {
    const restore = vi.fn();
    const onRowClick = vi.fn();
    const onSortChange = vi.fn();
    render(
      <IssueTable
        rows={[root]}
        onRowClick={onRowClick}
        onSortChange={onSortChange}
        sort={{ column: 'priority', direction: 'desc' }}
        rowAction={() => <button onClick={restore}>Restore</button>}
        labels={issuesEnUS.table}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(restore).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Priority' })[0]!);
    expect(onSortChange).toHaveBeenLastCalledWith({
      column: 'priority',
      direction: 'asc',
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Updated' })[0]!);
    expect(onSortChange).toHaveBeenLastCalledWith({
      column: 'updated',
      direction: 'desc',
    });
  });
});
