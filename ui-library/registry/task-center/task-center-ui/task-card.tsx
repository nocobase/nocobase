import { useTranslation } from '@nocobase/i18n/client';
import { Clock3, Layers } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Badge } from '#components/ui/badge';
import { Card } from '#components/ui/card';
import { Checkbox } from '#components/ui/checkbox';
import { cn } from 'cn';

import type {
  TaskBadgeVariant,
  TaskCardData,
  TaskCenterStatus,
  TaskListSelection,
} from './types.js';
import { useTaskTime } from './use-task-time.js';

const statusVariant: Record<TaskCenterStatus, TaskBadgeVariant> = {
  pending: 'secondary',
  completed: 'outline',
  cancelled: 'outline',
};

export interface TaskCardProps {
  readonly task: TaskCardData;
  /** Shows the task's subject in the meta line, for a list that spans several subjects. */
  readonly showSubject?: boolean;
  /** Draws the checkbox column while batch selection is offered. */
  readonly selection?: TaskListSelection;
  /** Opens the task, such as in `TaskDetailSheet`; the whole card becomes the target. */
  readonly onOpen?: (task: TaskCardData) => void;
  /** The instant relative times count from. Defaults to the current time. */
  readonly now?: Date;
}

/**
 * A task as a card: its title, status and time, then the summary its type contributes, if any. With `onOpen` the
 * title is a button stretched over the card, so a click anywhere opens it and the checkbox above it still toggles.
 */
export function TaskCard({
  now,
  onOpen,
  selection,
  showSubject = false,
  task,
}: TaskCardProps): ReactElement {
  const { t } = useTranslation();
  const when = useTaskTime(now)(task.time);
  const Icon = task.icon ?? Layers;
  const open = task.status === 'pending';
  const state = selection?.stateOf(task) ?? 'none';
  const checked = state === 'available' && Boolean(selection?.isSelected(task));
  return (
    <Card
      className={cn(
        'group/task relative gap-0 px-4 transition-shadow hover:shadow-md',
        checked ? 'bg-primary/5 ring-primary/40' : 'hover:ring-foreground/15',
        onOpen &&
          'has-[[data-slot=task-open]:focus-visible]:ring-2 has-[[data-slot=task-open]:focus-visible]:ring-ring/50',
      )}
    >
      <div className='flex items-start gap-3'>
        {selection ? (
          // Keeps titles aligned when only some cards can be selected.
          <span className='relative z-10 flex h-9 w-4 shrink-0 items-center'>
            {state === 'available' ? (
              <Checkbox
                aria-label={t('taskCenterUi.selection.select', {
                  name: task.title,
                  defaultValue: 'Select "{{name}}"',
                })}
                checked={checked}
                onCheckedChange={(value) => selection.onChange(task, value)}
              />
            ) : state === 'locked' ? (
              <DisabledCheckbox
                label={t('taskCenterUi.selection.lockedTask', {
                  name: task.title,
                  type: selection.selectedLabel ?? '',
                  defaultValue:
                    '"{{name}}" is unavailable: {{type}} is selected, and only tasks of one type can be selected together',
                })}
                hint={t('taskCenterUi.selection.otherType', {
                  type: selection.selectedLabel ?? '',
                  defaultValue:
                    '{{type}} is selected; only tasks of one type can be selected together',
                })}
              />
            ) : state === 'unsupported' ? (
              <DisabledCheckbox
                label={t('taskCenterUi.selection.unsupportedTask', {
                  name: task.title,
                  defaultValue: '"{{name}}" has no batch actions',
                })}
                hint={t('taskCenterUi.selection.unsupported', {
                  defaultValue: 'Tasks of this type are handled one at a time',
                })}
              />
            ) : null}
          </span>
        ) : null}
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            open
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon aria-hidden className='size-4' />
        </span>
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          <div className='flex items-start justify-between gap-3'>
            <h4
              className={cn(
                'min-w-0 truncate text-sm font-medium',
                !open && 'text-foreground/70',
              )}
              title={task.title}
            >
              {onOpen ? (
                <button
                  type='button'
                  data-slot='task-open'
                  className='text-left outline-none after:absolute after:inset-0 after:rounded-xl group-hover/task:text-primary'
                  onClick={() => onOpen(task)}
                >
                  {task.title}
                </button>
              ) : (
                task.title
              )}
            </h4>
            <Badge
              variant={task.statusVariant ?? statusVariant[task.status]}
              className='shrink-0'
            >
              {task.statusLabel}
            </Badge>
          </div>
          <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
            {showSubject && task.subjectLabel ? (
              <>
                <span>{task.subjectLabel}</span>
                <span aria-hidden>·</span>
              </>
            ) : null}
            <span className='inline-flex items-center gap-1'>
              <Clock3 aria-hidden className='size-3' />
              <time dateTime={task.time} title={when.absolute}>
                {open
                  ? t('taskCenterUi.time.received', {
                      time: when.relative,
                      defaultValue: 'Arrived {{time}}',
                    })
                  : t('taskCenterUi.time.closed', {
                      time: when.relative,
                      defaultValue: 'Closed {{time}}',
                    })}
              </time>
            </span>
          </p>
          {task.summary}
        </div>
      </div>
    </Card>
  );
}

function DisabledCheckbox({
  hint,
  label,
}: {
  readonly hint: string;
  readonly label: string;
}): ReactElement {
  return <Checkbox disabled aria-label={label} title={hint} />;
}

export interface TaskSummaryFieldsProps {
  /** Label and value pairs, in order. */
  readonly items: readonly (readonly [label: string, value: ReactNode])[];
  readonly className?: string;
}

/**
 * The inset a task type can render its summary with: label over value, two columns on a phone and three from the
 * small breakpoint, each value on one line.
 */
export function TaskSummaryFields({
  className,
  items,
}: TaskSummaryFieldsProps): ReactElement {
  return (
    <dl
      className={cn(
        'mt-2 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-muted/50 px-3 py-2.5 sm:grid-cols-3',
        className,
      )}
    >
      {items.map(([label, value]) => (
        <div key={label} className='flex min-w-0 flex-col gap-0.5'>
          <dt className='text-xs text-muted-foreground'>{label}</dt>
          <dd
            className='truncate text-sm'
            title={typeof value === 'string' ? value : undefined}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
