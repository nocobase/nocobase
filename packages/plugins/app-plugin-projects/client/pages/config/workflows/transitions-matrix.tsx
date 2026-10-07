import { useTranslation } from '@nocobase/i18n/client';
import { UserIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import {
  ANY_STATUS,
  APPROVER_ROLES,
  hasDefaultName,
  type TransitionActor,
  type WorkflowDefinition,
} from '../../../../shared/workflows.js';
import { PmTag } from '../../../components/pm-tag.js';
import { Checkbox } from '../../../components/ui/checkbox.js';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '../../../components/ui/popover.js';
import { Switch } from '../../../components/ui/switch.js';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group.js';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip.js';
import { cn } from 'cn';
import {
  actorsAt,
  approvalAt,
  impliedActorsAt,
  peopleAnywhere,
  setActorsAt,
  setApprovalAt,
  setPeopleAnywhere,
} from './workflow-model.js';
import { orderKinds, useActorKinds, useKindLabel } from '../../../lib/kinds.js';
import { PmKindIcon } from '../../../components/pm-kind-icon.js';

function ActorIcons({
  explicit,
  implied,
}: {
  readonly explicit: readonly TransitionActor[];
  readonly implied: readonly TransitionActor[];
}): ReactElement {
  const kindLabel = useKindLabel('workflows.actors');
  if (explicit.length === 0 && implied.length === 0)
    return (
      <span aria-hidden='true' className='text-muted-foreground/50'>
        ·
      </span>
    );
  return (
    <span className='inline-flex items-center gap-0.5'>
      {orderKinds([...explicit, ...implied]).map((actor) => {
        const faded = !explicit.includes(actor);
        return (
          <PmKindIcon
            kind={actor}
            key={actor}
            data-actor={actor}
            data-implied={faded || undefined}
            aria-hidden='true'
            className={cn('size-3.5', faded && 'opacity-35')}
          />
        );
      })}
      <span className='sr-only'>
        {[...explicit, ...implied].map(kindLabel).join(', ')}
      </span>
    </span>
  );
}

/**
 * What a cell allows, edited in place. Each actor shows the effective answer: one allowed through a `*` entry is
 * checked and locked (the entry is changed in its "Any status" row or column), one named by the cell's own entry is an
 * ordinary checkbox. Approval is off or on; turning it off clears the approvers.
 */
function CellEditor({
  definition,
  from,
  to,
  fromName,
  toName,
  onChange,
}: {
  readonly definition: WorkflowDefinition;
  readonly from: string;
  readonly to: string;
  readonly fromName: string;
  readonly toName: string;
  readonly onChange: (
    change: (definition: WorkflowDefinition) => WorkflowDefinition,
  ) => void;
}): ReactElement {
  const { t } = useTranslation();
  const kinds = useActorKinds();
  const kindLabel = useKindLabel('workflows.actors');
  const explicit = actorsAt(definition, from, to);
  const implied = impliedActorsAt(definition, from, to);
  const approvers = approvalAt(definition, from, to);
  // "Needed" with no approver picked yet is only a choice on screen: the definition keeps no empty approval.
  const [approvalOn, setApprovalOn] = useState(approvers.length > 0);
  const prefix = `pm-transition-${from}-${to}`;
  const hintId = `${prefix}-via-any`;

  return (
    <>
      <PopoverTitle className='text-sm font-medium'>
        {t('workflows.cellTitle', { from: fromName, to: toName })}
      </PopoverTitle>
      <section className='space-y-2' aria-labelledby={`${prefix}-who`}>
        <h3 id={`${prefix}-who`} className='text-xs text-muted-foreground'>
          {t('workflows.whoMayMove')}
        </h3>
        <span id={hintId} className='sr-only'>
          {t('workflows.viaAnyStatusHint')}
        </span>
        {orderKinds([...kinds, ...explicit]).map((actor) => {
          const id = `${prefix}-${actor}`;
          const viaAny = implied.includes(actor);
          return (
            <div key={actor} className='flex items-center gap-2 text-sm'>
              <Checkbox
                id={id}
                checked={viaAny || explicit.includes(actor)}
                disabled={viaAny}
                aria-describedby={viaAny ? hintId : undefined}
                onCheckedChange={(checked) =>
                  onChange((current) =>
                    setActorsAt(
                      current,
                      from,
                      to,
                      checked === true
                        ? [...actorsAt(current, from, to), actor]
                        : actorsAt(current, from, to).filter(
                            (item) => item !== actor,
                          ),
                    ),
                  )
                }
              />
              <label htmlFor={id} className='flex items-center gap-2'>
                <PmKindIcon
                  kind={actor}
                  className='size-3.5'
                  aria-hidden='true'
                />
                {kindLabel(actor)}
              </label>
              {viaAny ? (
                <Tooltip>
                  <TooltipTrigger
                    render={<span tabIndex={0} />}
                    className='ml-auto rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
                  >
                    <PmTag tone='grey' className='px-1.5'>
                      {t('workflows.viaAnyStatus')}
                    </PmTag>
                  </TooltipTrigger>
                  <TooltipContent className='max-w-64'>
                    {t('workflows.viaAnyStatusHint')}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          );
        })}
      </section>
      <section
        className='space-y-2 border-t pt-3'
        aria-labelledby={`${prefix}-approval`}
      >
        <div className='flex items-center justify-between gap-2'>
          <h3
            id={`${prefix}-approval`}
            className='text-xs text-muted-foreground'
          >
            {t('workflows.approvalTitle')}
          </h3>
          <ToggleGroup
            variant='outline'
            size='sm'
            spacing={0}
            value={[approvalOn ? 'on' : 'off']}
            aria-labelledby={`${prefix}-approval`}
            onValueChange={(values: string[]) => {
              const [next] = values;
              if (next !== 'on' && next !== 'off') return;
              setApprovalOn(next === 'on');
              if (next === 'off')
                onChange((current) => setApprovalAt(current, from, to, []));
            }}
          >
            <ToggleGroupItem value='off'>
              {t('workflows.approvalNone')}
            </ToggleGroupItem>
            <ToggleGroupItem value='on'>
              {t('workflows.approvalRequired')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        {approvalOn ? (
          <>
            <div className='flex flex-wrap gap-x-4 gap-y-2'>
              {APPROVER_ROLES.map((role) => {
                const id = `pm-approval-${from}-${to}-${role}`;
                return (
                  <label
                    key={role}
                    htmlFor={id}
                    className='flex items-center gap-2 text-sm'
                  >
                    <Checkbox
                      id={id}
                      checked={approvers.includes(role)}
                      onCheckedChange={(checked) =>
                        onChange((current) => {
                          const now = approvalAt(current, from, to);
                          return setApprovalAt(
                            current,
                            from,
                            to,
                            checked === true
                              ? [...now, role]
                              : now.filter((item) => item !== role),
                          );
                        })
                      }
                    />
                    {t(`workflows.approvers.${role}`)}
                  </label>
                );
              })}
            </div>
            <p className='text-xs text-muted-foreground'>
              {t('workflows.approvalHint')}
            </p>
          </>
        ) : null}
      </section>
    </>
  );
}

function Cell({
  definition,
  from,
  to,
  fromName,
  toName,
  readOnly,
  onChange,
}: {
  readonly definition: WorkflowDefinition;
  readonly from: string;
  readonly to: string;
  readonly fromName: string;
  readonly toName: string;
  readonly readOnly: boolean;
  readonly onChange: (
    change: (definition: WorkflowDefinition) => WorkflowDefinition,
  ) => void;
}): ReactElement {
  const { t } = useTranslation();
  if (from === to && from !== ANY_STATUS)
    return (
      <td
        data-from={from}
        data-to={to}
        className='border bg-muted/40 text-center text-muted-foreground/50'
      >
        <span aria-hidden='true'>—</span>
      </td>
    );
  const explicit = actorsAt(definition, from, to);
  const implied = impliedActorsAt(definition, from, to);
  const approvers = approvalAt(definition, from, to);
  const label = t('workflows.cellLabel', { from: fromName, to: toName });
  const icons = (
    <span className='inline-flex flex-col items-center gap-1'>
      <ActorIcons explicit={explicit} implied={implied} />
      {approvers.length > 0 ? (
        <PmTag
          tone='amber'
          className='px-1.5'
          title={t('workflows.approvalBy', {
            roles: approvers
              .map((role) => t(`workflows.approvers.${role}`))
              .join(t('workflows.listSeparator')),
          })}
        >
          {t('workflows.approval')}
        </PmTag>
      ) : null}
    </span>
  );
  if (readOnly)
    return (
      <td
        data-from={from}
        data-to={to}
        className='border text-center'
        title={label}
      >
        <span className='inline-flex min-h-9 w-full items-center justify-center py-1'>
          {icons}
        </span>
      </td>
    );
  return (
    <td data-from={from} data-to={to} className='border p-0 text-center'>
      <Popover>
        <PopoverTrigger
          aria-label={label}
          className='inline-flex min-h-9 w-full items-center justify-center py-1 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
        >
          {icons}
        </PopoverTrigger>
        <PopoverContent className='w-100 gap-3'>
          <CellEditor
            definition={definition}
            from={from}
            to={to}
            fromName={fromName}
            toName={toName}
            onChange={onChange}
          />
        </PopoverContent>
      </Popover>
    </td>
  );
}

/**
 * Who may move an issue from one status (rows) to another (columns), the same table in view and edit mode so what is
 * shown is what gets edited. "Any status" rows and columns stand for every status; what a cell allows only through
 * them is shown faded. The line above states the most common rule, people moving freely, which the matrix then only
 * adds to; in edit mode it is a switch and every cell opens a popover.
 *
 * A cell edits exactly one entry of the definition: the one whose `from` and `to` are its row and column, `*` only in
 * the "Any status" row or column. It never touches a wider entry, so a move a cell allows through `*` stays allowed
 * when its box is cleared; the popover says so, and the wider entry is changed in its own row or column.
 */
export function TransitionsMatrix({
  definition,
  readOnly,
  problems = [],
  onChange,
}: {
  readonly definition: WorkflowDefinition;
  readonly readOnly: boolean;
  readonly problems?: readonly string[];
  /** Required when not `readOnly`. */
  readonly onChange?: (
    change: (definition: WorkflowDefinition) => WorkflowDefinition,
  ) => void;
}): ReactElement {
  const { t } = useTranslation();
  const kinds = useActorKinds();
  const kindLabel = useKindLabel('workflows.actors');
  const change = onChange ?? (() => undefined);
  const nameOf = (key: string): string => {
    if (key === ANY_STATUS) return t('workflows.anyStatus');
    const status = definition.states.find((state) => state.key === key);
    if (!status) return key;
    return hasDefaultName(status)
      ? t(`status.${key}`, { defaultValue: status.name })
      : status.name;
  };
  const keys = [ANY_STATUS, ...definition.states.map((state) => state.key)];
  const anywhere = peopleAnywhere(definition);

  return (
    <div className='space-y-4'>
      {readOnly ? (
        <p className='flex items-center gap-3 rounded-lg border p-3 text-sm'>
          <UserIcon className='size-4 shrink-0' aria-hidden='true' />
          <span className='font-medium'>
            {anywhere
              ? t('workflows.peopleAnywhere')
              : t('workflows.peopleMatrixOnly')}
          </span>
        </p>
      ) : (
        <label
          htmlFor='pm-workflow-people-anywhere'
          className='flex items-start gap-3 rounded-lg border p-3 text-sm'
        >
          <Switch
            id='pm-workflow-people-anywhere'
            checked={anywhere}
            onCheckedChange={(on) =>
              change((current) => setPeopleAnywhere(current, on))
            }
          />
          <span>
            <span className='font-medium'>{t('workflows.peopleAnywhere')}</span>
            <span className='block text-muted-foreground'>
              {t('workflows.peopleAnywhereHint')}
            </span>
          </span>
        </label>
      )}
      {problems.map((problem) => (
        <p key={problem} role='alert' className='text-sm text-destructive'>
          {problem}
        </p>
      ))}
      <div className='overflow-x-auto'>
        <table
          aria-label={t('workflows.matrix')}
          className='w-full min-w-3xl table-fixed border-collapse text-sm'
        >
          <caption className='sr-only'>{t('workflows.matrixCaption')}</caption>
          <thead>
            <tr>
              <th
                scope='col'
                className='sticky left-0 z-10 w-28 border bg-background px-3 py-2 text-left text-xs font-normal text-muted-foreground'
              >
                {t('workflows.fromTo')}
              </th>
              {keys.map((key) => (
                <th
                  key={key}
                  scope='col'
                  className={cn(
                    'border px-2 py-2 text-center font-medium',
                    key === ANY_STATUS && 'bg-muted/60',
                  )}
                >
                  <span className='line-clamp-2'>{nameOf(key)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((from) => (
              <tr key={from}>
                <th
                  scope='row'
                  className={cn(
                    'sticky left-0 z-10 border bg-background px-3 py-1 text-left font-medium whitespace-nowrap',
                    from === ANY_STATUS && 'bg-muted',
                  )}
                >
                  {nameOf(from)}
                </th>
                {keys.map((to) => (
                  <Cell
                    key={to}
                    definition={definition}
                    from={from}
                    to={to}
                    fromName={nameOf(from)}
                    toName={nameOf(to)}
                    readOnly={readOnly}
                    onChange={change}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
        {kinds.map((actor) => {
          return (
            <span key={actor} className='inline-flex items-center gap-1'>
              <PmKindIcon
                kind={actor}
                className='size-3.5'
                aria-hidden='true'
              />
              {kindLabel(actor)}
            </span>
          );
        })}
        <span className='inline-flex items-center gap-1'>
          <UserIcon className='size-3.5 opacity-35' aria-hidden='true' />
          {t('workflows.impliedLegend')}
        </span>
      </p>
    </div>
  );
}
