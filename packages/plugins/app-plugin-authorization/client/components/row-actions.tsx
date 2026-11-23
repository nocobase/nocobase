import type { MouseEvent, ReactElement, ReactNode } from 'react';
import { EllipsisVerticalIcon } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';

/** One action on a table row or phone card. */
export interface RowAction {
  /** Stable identifier; `exposed` names actions by it. */
  readonly key: string;
  /** A verb only, such as "Edit": the row names the record (C3). */
  readonly label: ReactNode;
  readonly onClick?: () => void;
  /** The element the action renders as, such as `<Link to={…} />` for a child route. */
  readonly render?: ReactElement;
  /** Delete and other destructive actions: placed last, after a separator, in the destructive style. */
  readonly destructive?: boolean;
  /** Unavailable for now, such as while the action runs; hide what the viewer may never do instead. */
  readonly disabled?: boolean;
}

export interface RowActionsProps {
  /** Accessible name of the menu trigger, naming the record: "Actions for Apollo". */
  readonly label: string;
  /**
   * The row's actions in their stable order. Leave out what the viewer may not do; `false`, `null` and `undefined`
   * entries are skipped, so `canDelete && { … }` works.
   */
  readonly actions: readonly (RowAction | false | null | undefined)[];
  /**
   * Keys of actions shown as buttons before the menu. Only for an action the user or a confirmed page design asked
   * to show outside the menu; every other action stays in it. Never chosen by how often an action is used.
   */
  readonly exposed?: readonly string[];
}

// Menu items render in a portal, but React events still bubble to the row: a click on the trigger or an item must
// not also run the row's own click handler.
function stop(event: MouseEvent): void {
  event.stopPropagation();
}

/**
 * The actions of one table row (T1.5): one icon-only ghost "⋮" button at the end of the row opening a menu, the same
 * on every row and every page, and nothing at all when the viewer has no action on the record. `DataTable` hands the
 * same cell to the row's phone card.
 */
export function RowActions({
  label,
  actions,
  exposed = [],
}: RowActionsProps): ReactElement | null {
  const available = actions.filter((action): action is RowAction =>
    Boolean(action),
  );
  const outside = available.filter((action) => exposed.includes(action.key));
  const inside = available.filter((action) => !exposed.includes(action.key));
  const regular = inside.filter((action) => !action.destructive);
  const destructive = inside.filter((action) => action.destructive);
  if (available.length === 0) return null;
  return (
    <div
      data-slot='row-actions'
      className='flex items-center justify-end gap-1 whitespace-nowrap'
      onClick={stop}
    >
      {outside.map((action) => (
        <Button
          key={action.key}
          variant={action.destructive ? 'destructive' : 'ghost'}
          size='sm'
          disabled={action.disabled}
          onClick={action.onClick}
          {...(action.render
            ? { render: action.render, nativeButton: false }
            : {})}
        >
          {action.label}
        </Button>
      ))}
      {inside.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant='ghost' size='icon-sm' aria-label={label} />
            }
          >
            <EllipsisVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-auto min-w-40'>
            {regular.length > 0 ? (
              <DropdownMenuGroup>
                {regular.map((action) => (
                  <RowActionItem key={action.key} action={action} />
                ))}
              </DropdownMenuGroup>
            ) : null}
            {regular.length > 0 && destructive.length > 0 ? (
              <DropdownMenuSeparator />
            ) : null}
            {destructive.length > 0 ? (
              <DropdownMenuGroup>
                {destructive.map((action) => (
                  <RowActionItem key={action.key} action={action} />
                ))}
              </DropdownMenuGroup>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // Keeps exposed buttons aligned with rows that also have a menu.
        <span aria-hidden='true' className='size-7 shrink-0' />
      )}
    </div>
  );
}

function RowActionItem({
  action,
}: {
  readonly action: RowAction;
}): ReactElement {
  return (
    <DropdownMenuItem
      variant={action.destructive ? 'destructive' : 'default'}
      disabled={action.disabled}
      onClick={action.onClick}
      render={action.render}
    >
      {action.label}
    </DropdownMenuItem>
  );
}
