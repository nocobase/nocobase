/**
 * A generic kanban board: columns of cards that can be dragged within a column and between columns. It holds no data
 * of its own beyond the drag in progress: the consumer gives the columns and the items, renders each column and card,
 * and is told where a card was dropped (`onMove`), then gives the new items back.
 *
 * Adapted from the Kibo UI kanban (https://www.kibo-ui.com/components/kanban, MIT): the same composition
 * (`KanbanProvider` → `KanbanBoard` → `KanbanHeader` / `KanbanCards` → `KanbanCard`) on @dnd-kit, without tunnel-rat
 * or ScrollArea, with the drag kept as a draft so the consumer's items are never mutated, a collision strategy that
 * lets a card drop into an empty column, and screen reader announcements given as props.
 */
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  createContext,
  useContext,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from 'cn';

/** A card: its id (unique across cards and columns) and the column it is in. */
export interface KanbanItem {
  readonly id: string;
  readonly column: string;
}

/** A column: its id (unique across cards and columns) and its name, for the announcements. */
export interface KanbanColumn {
  readonly id: string;
  readonly name: string;
}

/** Where a card was dropped. */
export interface KanbanMove {
  readonly itemId: string;
  readonly fromColumn: string;
  readonly toColumn: string;
  /** Its place in the target column, counted without the card itself. */
  readonly toIndex: number;
}

/** What screen readers hear while a card moves; `{item}` and `{column}` are replaced. */
export interface KanbanLabels {
  readonly pickedUp: string;
  readonly movedOver: string;
  readonly dropped: string;
  readonly cancelled: string;
}

const defaultKanbanLabels: KanbanLabels = {
  pickedUp: 'Picked up {item} from {column}',
  movedOver: 'Moved {item} over {column}',
  dropped: 'Dropped {item} into {column}',
  cancelled: 'Cancelled moving {item}',
};

interface KanbanContextValue {
  readonly items: readonly KanbanItem[];
  readonly activeId: string | null;
  readonly disabled: boolean;
}

const KanbanContext = createContext<KanbanContextValue>({
  items: [],
  activeId: null,
  disabled: false,
});

/** The column under the pointer wins, so a card can be dropped into an empty column. */
const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length > 0 ? within : closestCorners(args);
};

export interface KanbanProviderProps<
  T extends KanbanItem,
  C extends KanbanColumn,
> {
  readonly columns: readonly C[];
  readonly items: readonly T[];
  /** Renders a column, usually a `KanbanBoard` with a `KanbanHeader` and `KanbanCards`. */
  readonly children: (column: C) => ReactNode;
  /** A card was dropped in another column or another place; the consumer applies it and gives new items. */
  readonly onMove?: (move: KanbanMove) => void;
  /** Renders the card that follows the pointer; without it the card itself moves. */
  readonly overlay?: (item: T) => ReactNode;
  /** No dragging, for a viewer who may not move cards. */
  readonly disabled?: boolean;
  /** The name of a card, for the announcements; its id by default. */
  readonly itemName?: (item: T) => string;
  readonly labels?: KanbanLabels;
  readonly className?: string;
}

function fill(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return template.replace(/\{(\w+)\}/gu, (match, key: string) =>
    key in values ? (values[key] ?? match) : match,
  );
}

/** The board: the drag context around the columns, laid out side by side. */
export function KanbanProvider<T extends KanbanItem, C extends KanbanColumn>({
  columns,
  items,
  children,
  onMove,
  overlay,
  disabled = false,
  itemName = (item) => item.id,
  labels = defaultKanbanLabels,
  className,
}: KanbanProviderProps<T, C>): ReactElement {
  // While a card moves, the board shows a draft of the items; the consumer's own are untouched until it applies the move.
  const [draft, setDraft] = useState<readonly T[] | null>(null);
  const [active, setActive] = useState<{
    readonly id: string;
    readonly column: string;
  } | null>(null);
  const shown = draft ?? items;
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnOf = (id: UniqueIdentifier | undefined, list: readonly T[]) =>
    id === undefined
      ? undefined
      : (list.find((item) => item.id === id)?.column ??
        columns.find((column) => column.id === id)?.id);
  const nameOf = (id: UniqueIdentifier) => {
    const item = shown.find((entry) => entry.id === id);
    return item ? itemName(item) : String(id);
  };
  const columnName = (id: string | undefined) =>
    columns.find((column) => column.id === id)?.name ?? '';

  function handleDragStart(event: DragStartEvent): void {
    const item = items.find((entry) => entry.id === event.active.id);
    if (!item) return;
    setActive({ id: item.id, column: item.column });
    setDraft(items);
  }

  function handleDragOver(event: DragOverEvent): void {
    const { active: dragged, over } = event;
    if (!over || !draft) return;
    const from = columnOf(dragged.id, draft);
    const to = columnOf(over.id, draft);
    if (!from || !to || from === to) return;
    // Into another column: the card takes the place of the card it is over, or goes last in an empty column.
    const index = draft.findIndex((item) => item.id === dragged.id);
    const overIndex = draft.findIndex((item) => item.id === over.id);
    const moved = draft.map((item, at) =>
      at === index ? { ...item, column: to } : item,
    );
    setDraft(
      overIndex === -1
        ? [...moved.filter((_, at) => at !== index), moved[index]]
        : arrayMove([...moved], index, overIndex),
    );
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active: dragged, over } = event;
    const start = active;
    let final: readonly T[] = draft ?? items;
    setActive(null);
    setDraft(null);
    if (!start || !over) return;
    const index = final.findIndex((item) => item.id === dragged.id);
    const overIndex = final.findIndex((item) => item.id === over.id);
    if (index !== -1 && overIndex !== -1 && index !== overIndex)
      final = arrayMove([...final], index, overIndex);
    const toColumn = columnOf(dragged.id, final);
    if (!toColumn) return;
    const toIndex = final
      .filter((item) => item.column === toColumn)
      .findIndex((item) => item.id === dragged.id);
    const fromIndex = items
      .filter((item) => item.column === start.column)
      .findIndex((item) => item.id === dragged.id);
    if (toColumn === start.column && toIndex === fromIndex) return;
    onMove?.({
      itemId: start.id,
      fromColumn: start.column,
      toColumn,
      toIndex,
    });
  }

  const announcements: Announcements = {
    onDragStart: ({ active: dragged }) =>
      fill(labels.pickedUp, {
        item: nameOf(dragged.id),
        column: columnName(columnOf(dragged.id, shown)),
      }),
    onDragOver: ({ active: dragged, over }) =>
      fill(labels.movedOver, {
        item: nameOf(dragged.id),
        column: columnName(columnOf(over?.id, shown)),
      }),
    onDragEnd: ({ active: dragged, over }) =>
      fill(labels.dropped, {
        item: nameOf(dragged.id),
        column: columnName(columnOf(over?.id, shown)),
      }),
    onDragCancel: ({ active: dragged }) =>
      fill(labels.cancelled, { item: nameOf(dragged.id) }),
  };

  const activeItem = active
    ? shown.find((item) => item.id === active.id)
    : undefined;

  return (
    <KanbanContext.Provider
      value={{ items: shown, activeId: active?.id ?? null, disabled }}
    >
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={collisionDetection}
        sensors={sensors}
        onDragStart={disabled ? undefined : handleDragStart}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragEnd={disabled ? undefined : handleDragEnd}
        onDragCancel={() => {
          setActive(null);
          setDraft(null);
        }}
      >
        <div
          className={cn(
            'flex size-full min-h-0 gap-3 overflow-x-auto',
            className,
          )}
        >
          {columns.map((column) => children(column))}
        </div>
        {overlay && typeof document !== 'undefined'
          ? createPortal(
              <DragOverlay>
                {activeItem ? overlay(activeItem) : null}
              </DragOverlay>,
              document.body,
            )
          : null}
      </DndContext>
    </KanbanContext.Provider>
  );
}

export interface KanbanBoardProps extends HTMLAttributes<HTMLElement> {
  /** The column's id. */
  readonly id: string;
  readonly children: ReactNode;
}

/** A column: a drop target that lights up while a card is over it. */
export function KanbanBoard({
  id,
  children,
  className,
  ...props
}: KanbanBoardProps): ReactElement {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <section
      ref={setNodeRef}
      data-over={isOver || undefined}
      className={cn(
        'flex h-full min-h-40 w-72 shrink-0 flex-col overflow-hidden rounded-xl bg-muted/50 ring-1 ring-transparent transition-shadow data-over:ring-primary/40',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export function KanbanHeader({
  className,
  ...props
}: KanbanHeaderProps): ReactElement {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 px-3 pt-3 pb-2 text-sm font-medium',
        className,
      )}
      {...props}
    />
  );
}

export interface KanbanCardsProps<T extends KanbanItem> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'id'
> {
  /** The column's id. */
  readonly id: string;
  readonly children: (item: T) => ReactNode;
  /** Below the cards, such as a "Load more" button. */
  readonly footer?: ReactNode;
}

/** The cards of a column, in order, scrolling inside the column. */
export function KanbanCards<T extends KanbanItem>({
  id,
  children,
  footer,
  className,
  ...props
}: KanbanCardsProps<T>): ReactElement {
  const { items } = useContext(KanbanContext);
  const cards = items.filter((item) => item.column === id) as T[];
  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <SortableContext
        id={id}
        items={cards.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('flex flex-col gap-2 p-2', className)} {...props}>
          {cards.map((item) => children(item))}
          {footer}
        </div>
      </SortableContext>
    </div>
  );
}

export interface KanbanCardProps extends HTMLAttributes<HTMLDivElement> {
  /** The item's id. */
  readonly id: string;
  readonly children: ReactNode;
}

/** A draggable card. Its content is the consumer's; it dims while it is being dragged. */
export function KanbanCard({
  id,
  children,
  className,
  ...props
}: KanbanCardProps): ReactElement {
  const { disabled } = useContext(KanbanContext);
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transition, transform: CSS.Translate.toString(transform) }}
      data-dragging={isDragging || undefined}
      className={cn(
        'rounded-lg bg-card text-card-foreground shadow-xs ring-1 ring-foreground/5 outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !disabled && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
        className,
      )}
      {...attributes}
      {...listeners}
      {...props}
    >
      {children}
    </div>
  );
}
