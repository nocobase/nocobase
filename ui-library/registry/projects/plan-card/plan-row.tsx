/**
 * One change of a plan card: what kind it is and what it is about, the fields it sets (an update as "was → becomes"),
 * whom it wakes and what it risks, its error, and once executed a link to what it made.
 */
import {
  usePlanErrorText,
  usePlanIssue,
  usePlanRowTitle,
  usePlanValueText,
  type PlanLookup,
} from '@nocobase/app-plugin-projects/client/kit';
import {
  PLAN_FLAG_TONE,
  planObjectHref,
  type RowView,
} from '@nocobase/app-plugin-projects/client/plan-model';
import type { PlanWake } from '@nocobase/app-plugin-projects/shared/plans';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  SquareArrowOutUpRightIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import { cn } from 'cn';

import { MarkdownView } from '../../components/markdown-view.js';
import { PlanTag } from './plan-tag.js';
import { fieldLabel, usePlanCardText, type PlanCardKey } from './plan-text.js';

const asRecord = (value: unknown): Readonly<Record<string, unknown>> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

function Line({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='flex min-w-0 gap-2 text-xs'>
      <dt className='w-16 shrink-0 text-muted-foreground'>{label}</dt>
      <dd className='min-w-0 flex-1 wrap-anywhere'>{children}</dd>
    </div>
  );
}

/** An existing issue a row names, as `PM-12 Title` once read, linked. */
function ExistingIssue({ id }: { readonly id: string }): ReactElement {
  const issue = usePlanIssue(id).data;
  return issue ? (
    <Link
      to={`/issues/${encodeURIComponent(issue.id)}`}
      className='hover:underline'
    >
      {issue.identifier} {issue.title}
    </Link>
  ) : (
    <span className='font-mono'>{id}</span>
  );
}

const CREATE_FIELDS = [
  'projectId',
  'priority',
  'labelIds',
  'executor',
  'ownerUserId',
  'stage',
  'statusKey',
  'startDate',
  'dueDate',
] as const;

/** An update row: each field it sets, as "was → becomes"; statuses by their names in the target's workflow. */
function UpdateDetails({
  view,
  lookup,
}: {
  readonly view: RowView;
  readonly lookup: PlanLookup;
}): ReactElement {
  const { t } = usePlanCardText();
  const text = usePlanValueText(lookup);
  const { params, row } = view;
  const set = asRecord(params.set);
  const id =
    row.check?.target?.id ??
    row.result?.target?.id ??
    (typeof params.issue === 'string' ? params.issue : null);
  // An issue the plan itself creates has no workflow yet: its status keys fall back to the built-in names.
  const statuses = usePlanIssue('statusKey' in set ? id : null).data?.statuses;
  const before = row.check?.baseline?.fields ?? {};
  const show = (field: string, value: unknown): string =>
    text(field, value, field === 'statusKey' ? statuses : undefined);
  return (
    <dl className='space-y-0.5'>
      {Object.entries(set).map(([field, to]) => (
        <Line key={field} label={fieldLabel(t, field)}>
          {field in before ? (
            <>
              <span className='text-muted-foreground line-through'>
                {show(field, before[field])}
              </span>
              <span aria-hidden='true'> → </span>
              <span className='sr-only'> {t('planCard.becomes')} </span>
            </>
          ) : null}
          <span className='font-medium'>{show(field, to)}</span>
        </Line>
      ))}
    </dl>
  );
}

/** The changes of a row, in words. */
function RowDetails({
  view,
  lookup,
}: {
  readonly view: RowView;
  readonly lookup: PlanLookup;
}): ReactElement | null {
  const { t } = usePlanCardText();
  const text = usePlanValueText(lookup);
  const { params, row } = view;
  switch (row.op) {
    case 'issue.create': {
      const parent = params.parentIssueId;
      return (
        <dl className='space-y-0.5'>
          {typeof parent === 'string' ? (
            <Line label={t('planCard.fields.parentIssueId')}>
              <ExistingIssue id={parent} />
            </Line>
          ) : null}
          {CREATE_FIELDS.filter(
            (field) => params[field] !== undefined && params[field] !== null,
          ).map((field) => (
            <Line key={field} label={fieldLabel(t, field)}>
              {text(field, params[field])}
            </Line>
          ))}
          {typeof params.description === 'string' && params.description ? (
            <Collapsible className='text-xs'>
              <CollapsibleTrigger className='group/description flex cursor-pointer items-center gap-1 rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'>
                <ChevronRightIcon
                  aria-hidden='true'
                  className='size-3 transition-transform group-data-[panel-open]/description:rotate-90'
                />
                {t('planCard.fields.description')}
              </CollapsibleTrigger>
              <CollapsibleContent className='mt-1 text-sm'>
                <MarkdownView content={params.description} />
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </dl>
      );
    }
    case 'issue.update':
      return <UpdateDetails view={view} lookup={lookup} />;
    case 'comment.create':
      return (
        <div className='rounded-md bg-muted/60 px-2 py-1.5 text-sm'>
          <MarkdownView
            content={typeof params.content === 'string' ? params.content : ''}
          />
        </div>
      );
    case 'project.create':
      return (
        <dl className='space-y-0.5'>
          <Line label={t('planCard.fields.visibility')}>
            {text('visibility', params.visibility ?? 'public')}
          </Line>
          {typeof params.description === 'string' && params.description ? (
            <Line label={t('planCard.fields.description')}>
              {params.description}
            </Line>
          ) : null}
        </dl>
      );
    default:
      return null;
  }
}

const WAKE_SKIPS: ReadonlySet<string> = new Set([
  'deferred',
  'denied',
  'blocked',
  'dormant',
  'duplicate',
  'archived',
  'noRunner',
  'unavailable',
]);

/** Whom a row wakes, as tags, each in its own list item. */
export function WakeTags({
  wakes,
}: {
  readonly wakes: readonly PlanWake[];
}): ReactElement | null {
  const { t } = usePlanCardText();
  if (wakes.length === 0) return null;
  return (
    <>
      {wakes.map((wake) => {
        const name = wake.name ?? wake.principalId;
        const skip = wake.skipped ?? 'unavailable';
        return (
          <li key={`${wake.kind}:${wake.principalId}:${wake.subjectId}`}>
            {wake.started ? (
              <PlanTag tone='violet'>{t('planCard.wakes', { name })}</PlanTag>
            ) : (
              <PlanTag tone='grey'>
                {t('planCard.wakesSkipped', {
                  name,
                  reason: WAKE_SKIPS.has(skip)
                    ? t(`planCard.wakeSkip.${skip}` as PlanCardKey)
                    : skip,
                })}
              </PlanTag>
            )}
          </li>
        );
      })}
    </>
  );
}

export interface PlanRowItemProps {
  readonly view: RowView;
  readonly views: readonly RowView[];
  /** Names for ids (`usePlanLookup`). */
  readonly lookup: PlanLookup;
  /** The row the last execution failed on. */
  readonly failedRowId?: string | null;
  /** At the end of its first line. */
  readonly actions?: ReactNode;
}

/** One change of a plan card, as a list item. */
export function PlanRowItem({
  view,
  views,
  lookup,
  failedRowId,
  actions,
}: PlanRowItemProps): ReactElement {
  const { t } = usePlanCardText();
  const errors = usePlanErrorText();
  const rowTitle = usePlanRowTitle();
  const { row } = view;
  const check = row.check;
  const result = row.result;
  const flags = check?.flags ?? [];
  const wakes = result?.wakes ?? check?.wakes ?? [];
  const error = check && !check.ok ? errors.row(check.error) : null;
  const failed = failedRowId === row.id;
  const href = planObjectHref(result?.created ?? result?.target);
  return (
    <li
      className={cn(
        'space-y-1.5 rounded-md border bg-background px-2.5 py-2',
        (error || failed) && 'border-destructive/50',
        view.removed && 'opacity-60',
      )}
      style={{ marginInlineStart: `${view.depth * 1.25}rem` }}
      data-plan-row={row.position}
    >
      <div className='flex min-w-0 items-start gap-1.5'>
        {result ? (
          <CheckCircle2Icon
            className='mt-0.5 size-4 shrink-0 text-[oklch(0.5_0.12_155)] dark:text-[oklch(0.8_0.12_155)]'
            aria-label={t('planCard.rowDone')}
          />
        ) : null}
        <div className='min-w-0 flex-1'>
          <p className='text-xs text-muted-foreground'>
            {t(`planCard.ops.${row.op}`)}
          </p>
          <p
            className={cn(
              'text-sm font-medium wrap-anywhere',
              view.removed && 'line-through',
            )}
          >
            {rowTitle(view, views)}
          </p>
        </div>
        {href ? (
          <Link
            to={href}
            className='inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline'
          >
            <SquareArrowOutUpRightIcon className='size-3' aria-hidden='true' />
            {t('planCard.openResult')}
          </Link>
        ) : null}
        {actions}
      </div>
      {flags.length > 0 || wakes.length > 0 ? (
        <ul
          className='flex flex-wrap gap-1'
          aria-label={t('planCard.flags.label')}
        >
          <WakeTags wakes={wakes} />
          {flags
            .filter(
              (flag) =>
                flag !== 'startsRun' || !wakes.some((wake) => wake.started),
            )
            .map((flag) => (
              <li key={flag}>
                <PlanTag tone={PLAN_FLAG_TONE[flag]}>
                  {t(`planCard.flags.${flag}`)}
                </PlanTag>
              </li>
            ))}
        </ul>
      ) : null}
      <RowDetails view={view} lookup={lookup} />
      {error ? (
        <p
          className='flex items-start gap-1 text-xs text-destructive'
          role='alert'
        >
          <AlertTriangleIcon
            className='mt-0.5 size-3.5 shrink-0'
            aria-hidden='true'
          />
          <span className='wrap-anywhere'>{error}</span>
        </p>
      ) : null}
      {view.removed ? (
        <p className='text-xs text-muted-foreground'>{t('planCard.removed')}</p>
      ) : null}
    </li>
  );
}
