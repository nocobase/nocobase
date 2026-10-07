import { SquareCheckIcon, XIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import {
  IssueCard,
  IssueCardSkeleton,
  type IssueCardIssue,
} from '@/components/issue-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const daysFromNow = (days: number): string => {
  const date = new Date(Date.now() + days * 86_400_000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const ISSUES: readonly IssueCardIssue[] = [
  {
    id: '1',
    identifier: 'PM-12',
    title: 'Drag cards between board columns',
    status: { name: 'In progress', color: 'blue' },
    priority: 'high',
    owner: { name: 'Ada Lovelace' },
    executor: { name: 'Code Agent', kind: 'agent' },
    dueDate: daysFromNow(3),
    labels: [{ id: 'l1', name: 'board', color: 'blue' }],
  },
  {
    id: '2',
    identifier: 'PM-14',
    title:
      'Export large tables as a stream with progress reported along the way',
    status: { name: 'In review', color: 'yellow' },
    priority: 'urgent',
    owner: { name: 'Grace Hopper' },
    dueDate: daysFromNow(-2),
    labels: [
      { id: 'l2', name: 'export', color: 'purple' },
      { id: 'l3', name: 'performance', color: 'orange' },
    ],
  },
  {
    id: '3',
    identifier: 'PM-15',
    title: 'Remember the last view per page',
    status: { name: 'Backlog', color: 'gray' },
    priority: 'none',
  },
];

export function IssueCardDemo(): ReactElement {
  const [selected, setSelected] = useState<string | null>(null);
  const [related, setRelated] = useState(ISSUES);
  return (
    <div className='min-h-svh space-y-8 bg-background p-6 text-foreground'>
      <section className='space-y-2'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          Rows that link
        </h2>
        <ul className='flex flex-col gap-1.5'>
          {ISSUES.map((issue) => (
            <li key={issue.id}>
              <IssueCard
                issue={issue}
                href={`#${issue.identifier}`}
                leading={<SquareCheckIcon />}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className='space-y-2'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          Plain rows in a list, with marks and a trailing action
        </h2>
        <ul className='divide-y overflow-hidden rounded-lg border'>
          {related.map((issue) => (
            <li key={issue.id}>
              <IssueCard
                issue={{ ...issue, labels: [] }}
                appearance='plain'
                href={`#${issue.identifier}`}
                className='px-3 py-2'
                marks={
                  issue.id === '1' ? (
                    <Badge variant='secondary' className='font-normal'>
                      waiting for 2
                    </Badge>
                  ) : null
                }
                trailing={
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    aria-label={`Remove ${issue.identifier}`}
                    onClick={() =>
                      setRelated((items) =>
                        items.filter((item) => item.id !== issue.id),
                      )
                    }
                  >
                    <XIcon />
                  </Button>
                }
              />
            </li>
          ))}
          <li>
            <IssueCardSkeleton appearance='plain' className='px-3 py-2' />
          </li>
        </ul>
      </section>

      <section className='space-y-2'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          Cards that select{selected ? ` · selected ${selected}` : ''}
        </h2>
        <div className='grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3'>
          {ISSUES.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              size='card'
              onSelect={(item) => setSelected(item.identifier)}
            />
          ))}
          <IssueCardSkeleton size='card' />
        </div>
      </section>
    </div>
  );
}
