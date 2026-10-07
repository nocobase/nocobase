import { useState, type ReactElement } from 'react';

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanMove,
} from '@/components/kanban';

interface Task {
  readonly id: string;
  readonly column: string;
  readonly title: string;
}

const COLUMNS = [
  { id: 'todo', name: 'To do' },
  { id: 'doing', name: 'In progress' },
  { id: 'review', name: 'In review' },
  { id: 'done', name: 'Done' },
];

const TASKS: readonly Task[] = [
  { id: 't1', column: 'todo', title: 'Export large tables as a stream' },
  { id: 't2', column: 'todo', title: 'Remember the last view per page' },
  { id: 't3', column: 'doing', title: 'Drag cards between columns' },
  { id: 't4', column: 'doing', title: 'Show who an agent waits for' },
  { id: 't5', column: 'review', title: 'Dark theme for the board' },
];

/** Applies a move the way a consumer would: the card changes column and takes its new place. */
function apply(items: readonly Task[], move: KanbanMove): Task[] {
  const card = items.find((item) => item.id === move.itemId);
  if (!card) return [...items];
  const rest = items.filter((item) => item.id !== move.itemId);
  const target = rest.filter((item) => item.column === move.toColumn);
  const before = target[move.toIndex];
  const at = before ? rest.indexOf(before) : rest.length;
  rest.splice(at, 0, { ...card, column: move.toColumn });
  return rest;
}

export function KanbanDemo(): ReactElement {
  const [items, setItems] = useState<readonly Task[]>(TASKS);
  const [last, setLast] = useState<KanbanMove | null>(null);
  return (
    <div className='flex h-svh flex-col gap-3 bg-background p-6 text-foreground'>
      <p className='text-sm text-muted-foreground'>
        {last
          ? `Moved ${last.itemId} from ${last.fromColumn} to ${last.toColumn} at ${last.toIndex}`
          : 'Drag a card within or between columns.'}
      </p>
      <div className='min-h-0 flex-1'>
        <KanbanProvider
          columns={COLUMNS}
          items={items}
          itemName={(item) => item.title}
          onMove={(move) => {
            setLast(move);
            setItems((current) => apply(current, move));
          }}
          overlay={(item) => (
            <div className='rounded-lg bg-card p-3 text-sm shadow-lg ring-1 ring-primary/30'>
              {item.title}
            </div>
          )}
        >
          {(column) => (
            <KanbanBoard key={column.id} id={column.id}>
              <KanbanHeader>
                {column.name}
                <span className='text-muted-foreground tabular-nums'>
                  {items.filter((item) => item.column === column.id).length}
                </span>
              </KanbanHeader>
              <KanbanCards<Task> id={column.id}>
                {(item) => (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    className='p-3 text-sm'
                  >
                    {item.title}
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
