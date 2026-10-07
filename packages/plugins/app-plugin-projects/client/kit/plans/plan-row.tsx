import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  SquareArrowOutUpRightIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import type { StatusDefinition } from '../../../shared/issues.js';
import type { PlanWake } from '../../../shared/plans.js';
import { PmMarkdown } from '../../components/pm-markdown.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible.js';
import { PmTag } from '../../components/pm-tag.js';
import { cn } from 'cn';
import type { PlanLookup } from './lookup.js';
import { usePlanIssue, usePlanValueText } from './lookup.js';
import {
  asRecord,
  planObjectHref as resultHref,
  type RowView,
} from './model.js';
import { FLAG_TONE, rowTitle, useRowError } from './plan-text.js';

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

/** An existing issue a row names, as `PM-12 Title` once read (the cached issue detail), linked. */
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

/**
 * The statuses an `issue.update` row's target can take: its workflow's, read from the cached issue detail (an issue
 * the plan itself creates has none yet, so built-in keys fall back to their translated names).
 */
function useTargetStatuses(
  view: RowView,
): readonly StatusDefinition[] | undefined {
  const { params, row } = view;
  const id =
    row.check?.target?.id ??
    row.result?.target?.id ??
    (typeof params.issue === 'string' ? params.issue : null);
  const wantsStatus = 'statusKey' in asRecord(params.set);
  return usePlanIssue(wantsStatus ? id : null).data?.statuses;
}

/** An update row: each field it sets, as "was → becomes"; statuses by their names in the target's workflow. */
function UpdateDetails({
  view,
  lookup,
}: {
  readonly view: RowView;
  readonly lookup: PlanLookup;
}): ReactElement {
  const { t } = useTranslation();
  const text = usePlanValueText(lookup);
  const statuses = useTargetStatuses(view);
  const { params, row } = view;
  const set = asRecord(params.set);
  const before = row.check?.baseline?.fields ?? {};
  const show = (field: string, value: unknown): string =>
    text(field, value, field === 'statusKey' ? statuses : undefined);
  return (
    <dl className='space-y-0.5'>
      {Object.entries(set).map(([field, to]) => (
        <Line
          key={field}
          label={t(`plans.fields.${field}`, { defaultValue: field })}
        >
          {field in before ? (
            <>
              <span className='text-muted-foreground line-through'>
                {show(field, before[field])}
              </span>
              <span aria-hidden='true'> → </span>
              <span className='sr-only'> {t('plans.becomes')} </span>
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
  const { t } = useTranslation();
  const text = usePlanValueText(lookup);
  const { params, row } = view;
  switch (row.op) {
    case 'issue.create': {
      const parent = params.parentIssueId;
      return (
        <dl className='space-y-0.5'>
          {typeof parent === 'string' ? (
            <Line label={t('plans.fields.parentIssueId')}>
              <ExistingIssue id={parent} />
            </Line>
          ) : null}
          {CREATE_FIELDS.filter(
            (field) => params[field] !== undefined && params[field] !== null,
          ).map((field) => (
            <Line key={field} label={t(`plans.fields.${field}`)}>
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
                {t('plans.fields.description')}
              </CollapsibleTrigger>
              <CollapsibleContent className='mt-1 text-sm'>
                <PmMarkdown content={params.description} />
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
          <PmMarkdown
            content={typeof params.content === 'string' ? params.content : ''}
          />
        </div>
      );
    case 'project.create':
      return (
        <dl className='space-y-0.5'>
          <Line label={t('plans.fields.visibility')}>
            {text('visibility', params.visibility ?? 'public')}
          </Line>
          {typeof params.description === 'string' && params.description ? (
            <Line label={t('plans.fields.description')}>
              {params.description}
            </Line>
          ) : null}
        </dl>
      );
    default:
      return null;
  }
}

/** Whom a row wakes, as tags. */
export function WakeTags({
  wakes,
}: {
  readonly wakes: readonly PlanWake[];
}): ReactElement | null {
  const { t } = useTranslation();
  if (wakes.length === 0) return null;
  return (
    <>
      {wakes.map((wake) => {
        const name = wake.name ?? wake.principalId;
        return (
          <li key={`${wake.kind}:${wake.principalId}:${wake.subjectId}`}>
            {wake.started ? (
              <PmTag tone='violet'>{t('plans.wakes', { name })}</PmTag>
            ) : (
              <PmTag tone='grey'>
                {t('plans.wakesSkipped', {
                  name,
                  reason: t(`plans.wakeSkip.${wake.skipped ?? 'unavailable'}`, {
                    defaultValue: wake.skipped ?? '',
                  }),
                })}
              </PmTag>
            )}
          </li>
        );
      })}
    </>
  );
}

/**
 * One change of a plan card: what kind it is and what it is about, the fields it sets (an update as "was → becomes"),
 * whom it wakes and what it risks, its error, and once executed a link to what it made.
 */
export function PlanRowItem({
  view,
  views,
  lookup,
  failedRowId,
  actions,
}: {
  readonly view: RowView;
  readonly views: readonly RowView[];
  readonly lookup: PlanLookup;
  /** The row the last execution failed on. */
  readonly failedRowId?: string | null;
  readonly actions?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const errorText = useRowError();
  const { row } = view;
  const title = rowTitle(view, views, t);
  const check = row.check;
  const result = row.result;
  const flags = check?.flags ?? [];
  const wakes = result?.wakes ?? check?.wakes ?? [];
  const error = check && !check.ok ? errorText(check.error) : null;
  const failed = failedRowId === row.id;
  const href = resultHref(result?.created ?? result?.target);
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
            aria-label={t('plans.rowDone')}
          />
        ) : null}
        <div className='min-w-0 flex-1'>
          <p className='text-xs text-muted-foreground'>
            {t(`plans.ops.${row.op}`)}
          </p>
          <p
            className={cn(
              'text-sm font-medium wrap-anywhere',
              view.removed && 'line-through',
            )}
          >
            {title}
          </p>
        </div>
        {href ? (
          <Link
            to={href}
            className='inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline'
          >
            <SquareArrowOutUpRightIcon className='size-3' aria-hidden='true' />
            {t('plans.openResult')}
          </Link>
        ) : null}
        {actions}
      </div>
      {flags.length > 0 || wakes.length > 0 ? (
        <ul
          className='flex flex-wrap gap-1'
          aria-label={t('plans.flags.label')}
        >
          <WakeTags wakes={wakes} />
          {flags
            .filter(
              (flag) =>
                flag !== 'startsRun' || !wakes.some((wake) => wake.started),
            )
            .map((flag) => (
              <li key={flag}>
                <PmTag tone={FLAG_TONE[flag]}>{t(`plans.flags.${flag}`)}</PmTag>
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
        <p className='text-xs text-muted-foreground'>{t('plans.removed')}</p>
      ) : null}
    </li>
  );
}
