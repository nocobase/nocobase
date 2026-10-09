import { useState, type ReactElement } from 'react';

import {
  IssueTable,
  type IssueTableRow,
  type IssueTableSort,
} from '#components/issue-table';

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const ROWS: readonly IssueTableRow[] = [
  {
    id: '1',
    identifier: 'PM-12',
    title: 'Drag cards between board columns',
    labels: [{ id: 'l1', name: 'board', color: 'blue' }],
    status: { name: 'In progress', color: 'blue' },
    priority: 'high',
    owner: { name: 'Ada Lovelace' },
    executor: { name: 'Code Agent', kind: 'agent' },
    updatedAt: minutesAgo(12),
  },
  {
    id: '2',
    identifier: 'PM-14',
    title: 'Export large tables as a stream with progress',
    labels: [
      { id: 'l2', name: 'export', color: 'purple' },
      { id: 'l3', name: 'performance', color: 'orange' },
    ],
    status: { name: 'In review', color: 'yellow' },
    priority: 'urgent',
    owner: { name: 'Grace Hopper' },
    executor: { name: 'Grace Hopper' },
    updatedAt: minutesAgo(90),
  },
  {
    id: '3',
    identifier: 'PM-15',
    title: 'Remember the last view per page',
    labels: [],
    status: { name: 'Backlog', color: 'gray' },
    priority: 'none',
    owner: { name: 'Alan Turing' },
    executor: null,
    updatedAt: minutesAgo(60 * 30),
  },
];

export function IssueTableDemo(): ReactElement {
  const [sort, setSort] = useState<IssueTableSort>({
    column: 'updated',
    direction: 'desc',
  });
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const factor = sort.direction === 'asc' ? 1 : -1;
  const rows = [...ROWS].sort((a, b) =>
    sort.column === 'updated'
      ? factor * a.updatedAt.localeCompare(b.updatedAt)
      : sort.column === 'identifier'
        ? factor * a.identifier.localeCompare(b.identifier)
        : factor * a.priority.localeCompare(b.priority),
  );
  return (
    <div className='min-h-svh space-y-3 bg-background p-6 text-foreground'>
      <IssueTable
        rows={rows}
        sort={sort}
        onSortChange={setSort}
        selectedIds={selected}
        onSelectedIdsChange={setSelected}
        rowHref={(row) => `#${row.identifier}`}
        onRowClick={(row) => {
          window.location.hash = row.identifier;
        }}
      />
    </div>
  );
}
