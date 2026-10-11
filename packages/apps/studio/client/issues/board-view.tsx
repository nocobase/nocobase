/**
 * The board view: a column per workflow status from the projects plugin's board pages, in the installed `kanban`.
 * Dropping a card in another column changes its status through the projects plugin (`useBoardMove`: the card moves at
 * once, a refused move snaps back with a notice, handing an issue to an agent asks "Start now?"). Order inside a
 * column is the server's, so a drop within a column changes nothing. Without `issues/edit` cards do not drag. Each card
 * shows Studio's marks (`issue-marks.tsx`).
 */
import {
  buildBoardColumns,
  canEditIssues,
  statusTone,
  useBoardMove,
  useBoardPages,
  useStatusName,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  PmListSkeleton,
  PmLoadError,
  StartDialog,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueListItem } from '@nocobase/app-plugin-projects/shared/issues';
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo, type ReactElement } from 'react';

import { IssueCard, type IssueCardIssue } from '@/components/issue-card';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanLabels,
} from '@/components/kanban';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from 'cn';

import { IssueMarks } from './issue-marks.js';
import { toneColor } from './rows.js';
import type { IssuesPage } from './use-issues-page.js';

interface Card {
  readonly id: string;
  readonly column: string;
  readonly issue: IssueListItem;
}

const DOT: Readonly<Record<string, string>> = {
  gray: 'bg-muted-foreground/50',
  blue: 'bg-blue-500 dark:bg-blue-400',
  purple: 'bg-violet-500 dark:bg-violet-400',
  yellow: 'bg-amber-500 dark:bg-amber-400',
  green: 'bg-emerald-500 dark:bg-emerald-400',
  red: 'bg-red-500 dark:bg-red-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
};

/** The projects plugin's issue as a board card shows it: the column says its status. */
function cardIssue(issue: IssueListItem): IssueCardIssue {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    priority: issue.priority,
    labels: issue.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    })),
    executor: issue.executor
      ? {
          name: issue.executorName ?? issue.executor.id,
          kind: issue.executor.type,
        }
      : null,
  };
}

function CardFace({
  card,
  href,
  onOpen,
}: {
  readonly card: Card;
  readonly href?: string;
  readonly onOpen?: () => void;
}): ReactElement {
  return (
    <IssueCard
      issue={cardIssue(card.issue)}
      size='card'
      appearance='plain'
      {...(href ? { href } : {})}
      {...(onOpen ? { onSelect: () => onOpen() } : {})}
      marks={
        <IssueMarks issue={card.issue} placement='card' className='flex' />
      }
    />
  );
}

export function IssueBoardView({
  page,
  issueHref,
  onOpen,
}: {
  readonly page: IssuesPage;
  readonly issueHref: (issueId: string) => string;
  readonly onOpen: (issueId: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const board = useBoardPages(page.filters, true);
  const move = useBoardMove();
  const canEdit = canEditIssues(useViewer());
  const statusName = useStatusName();
  const groups = board.groups;
  const columns = useMemo(
    () => (groups ? buildBoardColumns(groups, move.overrides) : []),
    [groups, move.overrides],
  );
  const statuses = columns.map((column) => column.status);

  if (board.query.isError && !board.query.isFetching)
    return (
      <PmLoadError
        title={t('issuesPage.loadFailed')}
        error={board.query.error}
        onRetry={() => void board.query.refetch()}
      />
    );
  if (!groups) return <PmListSkeleton />;

  const cards: Card[] = columns.flatMap((column) =>
    column.issues.map((issue) => ({
      id: issue.id,
      column: column.status.key,
      issue,
    })),
  );
  const kanbanLabels = t('issuesPage.kanban', {
    returnObjects: true,
  }) as unknown as KanbanLabels;

  return (
    <div
      role='region'
      aria-label={t('issuesPage.boardLabel')}
      className='h-full'
    >
      <KanbanProvider
        columns={columns.map((column) => ({
          id: column.status.key,
          name: statusName(statuses, column.status.key),
        }))}
        items={cards}
        disabled={!canEdit}
        itemName={(card) => card.issue.identifier}
        labels={kanbanLabels}
        className='pb-2'
        onMove={(change) => {
          if (change.toColumn === change.fromColumn) return;
          const card = cards.find((item) => item.id === change.itemId);
          const target = statuses.find(
            (status) => status.key === change.toColumn,
          );
          if (card) move.drop(card.issue, target, statuses);
        }}
        overlay={(card) => (
          <div className='rounded-lg bg-card shadow-lg ring-1 ring-primary/30'>
            <CardFace card={card} />
          </div>
        )}
      >
        {(column) => {
          const color = toneColor(statusTone(statuses, column.id));
          const count = cards.filter(
            (card) => card.column === column.id,
          ).length;
          const more = board.more[column.id];
          return (
            <KanbanBoard
              key={column.id}
              id={column.id}
              aria-label={`${column.name} ${count}`}
            >
              <KanbanHeader>
                <span
                  aria-hidden
                  className={cn('size-2 rounded-full', DOT[color])}
                />
                <h3>{column.name}</h3>
                <span className='text-muted-foreground tabular-nums'>
                  {count}
                </span>
              </KanbanHeader>
              <KanbanCards<Card>
                id={column.id}
                footer={
                  more?.hasMore ? (
                    <Button
                      variant='ghost'
                      size='sm'
                      disabled={more.loading}
                      onClick={more.onLoadMore}
                    >
                      {more.loading ? (
                        <Spinner data-icon='inline-start' />
                      ) : null}
                      {t('issuesPage.loadMore')}
                    </Button>
                  ) : null
                }
              >
                {(card) => (
                  <KanbanCard
                    key={card.id}
                    id={card.id}
                    data-issue={card.issue.identifier}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest('a')) return;
                      onOpen(card.id);
                    }}
                    className='hover:ring-foreground/15'
                  >
                    <CardFace
                      card={card}
                      href={issueHref(card.id)}
                      onOpen={() => onOpen(card.id)}
                    />
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          );
        }}
      </KanbanProvider>
      <StartDialog
        request={move.startRequest}
        onDecide={move.decide}
        onCancel={move.cancel}
      />
    </div>
  );
}
