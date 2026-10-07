import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  LockIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useRef, useState } from 'react';

import type { StatusCategory } from '../../../../shared/issues.js';
import {
  STATUS_NAME_MAX,
  hasDefaultName,
  type WorkflowDefinition,
  type WorkflowStatus,
} from '../../../../shared/workflows.js';
import { PmColorSwatches } from '../../../components/pm-labels.js';
import { PmTag } from '../../../components/pm-tag.js';
import { Button } from '../../../components/ui/button.js';
import { Input } from '../../../components/ui/input.js';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '../../../components/ui/popover.js';
import { cn } from 'cn';
import {
  CATEGORY_NODE_CLASS,
  addStatus,
  moveStatus,
  removeStatus,
  updateStatus,
} from './workflow-model.js';
import { WorkflowDiagram } from './workflow-diagram.js';

type Change = (
  change: (definition: WorkflowDefinition) => WorkflowDefinition,
) => void;

/** A status's name as the editor shows it: a built-in status still named by default shows its translation. */
function useStatusLabel(): (status: WorkflowStatus) => string {
  const { t } = useTranslation();
  return (status) =>
    hasDefaultName(status)
      ? t(`status.${status.key}`, { defaultValue: status.name })
      : status.name;
}

/** Whether the status has a neighbour of its own category in that direction, which is what moving swaps it with. */
function canMove(
  definition: WorkflowDefinition,
  key: string,
  direction: -1 | 1,
): boolean {
  const index = definition.states.findIndex((state) => state.key === key);
  const category = definition.states[index]?.category;
  for (
    let other = index + direction;
    other >= 0 && other < definition.states.length;
    other += direction
  )
    if (definition.states[other].category === category) return true;
  return false;
}

/** One status on the flow strip as a button; its popover renames, recolours, moves or removes it. */
function StatusChip({
  definition,
  status,
  problems,
  onChange,
}: {
  readonly definition: WorkflowDefinition;
  readonly status: WorkflowStatus;
  readonly problems: readonly string[];
  readonly onChange: Change;
}): ReactElement {
  const { t } = useTranslation();
  const label = useStatusLabel()(status);
  const nameRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t('workflows.editStatus', { name: label })}
        aria-invalid={problems.length > 0 || undefined}
        data-category={status.category}
        className={cn(
          'flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          CATEGORY_NODE_CLASS[status.category],
          problems.length > 0 && 'ring-2 ring-destructive',
        )}
      >
        <span className='truncate'>{label}</span>
        {status.builtIn ? (
          <LockIcon
            className='size-3 shrink-0 text-muted-foreground'
            aria-hidden='true'
          />
        ) : null}
      </PopoverTrigger>
      <PopoverContent className='w-72' initialFocus={nameRef}>
        <PopoverTitle className='text-sm font-medium'>{label}</PopoverTitle>
        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
          <code>{status.key}</code>
          <span>{t(`workflows.categories.${status.category}.title`)}</span>
          {status.builtIn ? (
            <PmTag tone='grey' title={t('workflows.builtInHint')}>
              <LockIcon className='size-3' aria-hidden='true' />
              {t('workflows.builtInStatus')}
            </PmTag>
          ) : null}
        </div>
        <Input
          ref={nameRef}
          value={label}
          maxLength={STATUS_NAME_MAX}
          aria-label={t('workflows.statusName', { name: label })}
          aria-invalid={problems.length > 0 || undefined}
          className='h-8'
          onChange={(event) =>
            onChange((current) =>
              updateStatus(current, status.key, { name: event.target.value }),
            )
          }
        />
        <PmColorSwatches
          value={status.color}
          label={t('workflows.statusColor', { name: label })}
          onChange={(color) =>
            onChange((current) => updateStatus(current, status.key, { color }))
          }
        />
        <div className='flex items-center gap-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            disabled={!canMove(definition, status.key, -1)}
            aria-label={t('workflows.moveEarlier', { name: label })}
            title={t('workflows.moveEarlier', { name: label })}
            onClick={() =>
              onChange((current) => moveStatus(current, status.key, -1))
            }
          >
            <ArrowLeftIcon />
          </Button>
          <Button
            variant='ghost'
            size='icon-sm'
            disabled={!canMove(definition, status.key, 1)}
            aria-label={t('workflows.moveLater', { name: label })}
            title={t('workflows.moveLater', { name: label })}
            onClick={() =>
              onChange((current) => moveStatus(current, status.key, 1))
            }
          >
            <ArrowRightIcon />
          </Button>
          {status.builtIn ? (
            <span className='ml-auto text-xs text-muted-foreground'>
              {t('workflows.builtInHint')}
            </span>
          ) : (
            <Button
              variant='ghost'
              size='sm'
              className='ml-auto text-destructive'
              onClick={() => {
                setOpen(false);
                onChange((current) => removeStatus(current, status.key));
              }}
            >
              <Trash2Icon data-icon='inline-start' />
              {t('workflows.removeStatus', { name: label })}
            </Button>
          )}
        </div>
        {problems.map((problem) => (
          <p key={problem} role='alert' className='text-xs text-destructive'>
            {problem}
          </p>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** "+ Add" under a category's column: a popover that names a new status and adds it at the end of that category. */
function AddStatusChip({
  category,
  onChange,
}: {
  readonly category: StatusCategory;
  readonly onChange: Change;
}): ReactElement {
  const { t } = useTranslation();
  const title = t(`workflows.categories.${category}.title`);
  const nameRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!name.trim()) return;
    onChange((current) =>
      addStatus(current, {
        name,
        category,
        color: category === 'done' ? 'green' : 'gray',
      }),
    );
    setName('');
    setOpen(false);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t('workflows.newStatusIn', { category: title })}
        className={cn(
          'flex h-8 w-full max-w-40 items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        )}
      >
        <PlusIcon className='size-3.5' aria-hidden='true' />
        {t('workflows.addStatus')}
      </PopoverTrigger>
      <PopoverContent className='w-72' initialFocus={nameRef}>
        <PopoverTitle className='text-sm font-medium'>
          {t('workflows.newStatusIn', { category: title })}
        </PopoverTitle>
        <PopoverDescription className='text-xs'>
          {t(`workflows.categories.${category}.hint`)}
        </PopoverDescription>
        <form onSubmit={submit} className='flex items-center gap-2'>
          <Input
            ref={nameRef}
            value={name}
            maxLength={STATUS_NAME_MAX}
            placeholder={t('workflows.newStatusPlaceholder')}
            aria-label={t('workflows.newStatusName', { category: title })}
            className='h-8'
            onChange={(event) => setName(event.target.value)}
          />
          <Button type='submit' size='sm' disabled={!name.trim()}>
            {t('workflows.addStatus')}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Edit mode of the status card: the same diagram as view mode, with each status a button whose popover edits it and a
 * "+" closing each category's column (even one with no status yet). Problems the server reported for a status mark its
 * button and are listed under the diagram, so they show without opening it.
 */
export function WorkflowFlowEditor({
  definition,
  problems,
  onChange,
}: {
  readonly definition: WorkflowDefinition;
  readonly problems: ReadonlyMap<string, readonly string[]>;
  readonly onChange: Change;
}): ReactElement {
  const { t } = useTranslation();
  const label = useStatusLabel();
  const listed = definition.states.flatMap((status) =>
    (problems.get(status.key) ?? []).map((message) => ({
      key: `${status.key}:${message}`,
      text: t('workflows.statusProblem', { name: label(status), message }),
    })),
  );
  return (
    <div className='space-y-3'>
      <WorkflowDiagram
        definition={definition}
        renderStatus={(status) => (
          <StatusChip
            definition={definition}
            status={status}
            problems={problems.get(status.key) ?? []}
            onChange={onChange}
          />
        )}
        renderAdd={(category) => (
          <AddStatusChip category={category} onChange={onChange} />
        )}
      />
      {listed.length > 0 ? (
        <ul className='space-y-1'>
          {listed.map((entry) => (
            <li
              key={entry.key}
              role='alert'
              className='text-xs text-destructive'
            >
              {entry.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
