/**
 * An operation plan of `@nocobase/app-plugin-projects` as a card: what it changes row by row — whom each row wakes and
 * what it risks — and what can be done with it now. A pending plan executes (asking once more when a row is risky) or
 * is voided; a failed or stale one is checked again; an executed one can be undone within the undo window, in one step
 * after a preview of what will be reverted (`plan-undo.tsx`). An open plan's rows can be edited in place
 * (`plan-editor.tsx`). Reading and acting go through the plugin's headless hooks, so the card stays current when the
 * server announces a plan change. Under its title it links the issues it is about (`plan-issue-links.tsx`), the one it was
 * opened from first.
 */
import {
  invalidRows,
  usePlanErrorText,
  usePlanLookup,
  usePlanMutations,
  usePlanQuery,
  usePlanWording,
  useViewer,
  type PlanAction,
} from '@nocobase/app-plugin-projects/client/kit';
import {
  abilitiesOf,
  effectiveStatus,
  isClosedPlan,
  planCountdown,
  planHref,
  rowViews,
} from '@nocobase/app-plugin-projects/client/plan-model';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  Undo2Icon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { cn } from 'cn';

import { usePlanConfirm } from './plan-confirm.js';
import { PlanEditor } from './plan-editor.js';
import { PlanIssueLinks } from './plan-issue-links.js';
import type { PlanIssueHref } from './plan-issues.js';
import { PlanRowItem } from './plan-row.js';
import { PlanStatusTag } from './plan-tag.js';
import {
  relativeTime,
  usePlanCardText,
  usePlanNotify,
  type PlanCardKey,
} from './plan-text.js';
import { PlanUndoDialog } from './plan-undo.js';

export interface PlanCardProps {
  readonly planId: string;
  /** The plan, when the caller has it already; the card keeps it current. */
  readonly plan?: Plan;
  /** Whether the rows show at first; closed plans (voided, expired, undone) fold by default. */
  readonly defaultExpanded?: boolean;
  /** Offers editing an open plan's rows in place. Defaults to true. */
  readonly editable?: boolean;
  /** Links the title to the plan's page (`planHref`, `/issues/plans/:id`). Defaults to true. */
  readonly linkTitle?: boolean;
  /** The issue (id or key) the plan was opened from, listed first among the plan's issues. */
  readonly firstIssueId?: string | null;
  /** Where each of the plan's issues links; the plugin's issue page (`/issues/:key`) by default. */
  readonly issueHref?: PlanIssueHref;
  /** Called with the plan after each action. */
  readonly onChange?: (plan: Plan) => void;
  /**
   * Lays the plan out in a frame of the caller's, such as a detail pane's header and body, instead of the card: the rows
   * always show, and the actions come at the default button size.
   */
  readonly frame?: (parts: PlanCardParts) => ReactElement;
  readonly className?: string;
}

/** What `PlanCardProps.frame` lays out. */
export interface PlanCardParts {
  readonly plan: Plan;
  readonly title: string;
  /** The plan's page (`planHref`). */
  readonly href: string;
  /** Its status, rows, source, proposer and countdown, as short facts. */
  readonly meta: ReactNode;
  /** Execute, check again, edit, undo and void, as the viewer may; null when there is nothing to do. */
  readonly actions: ReactNode;
  /** The issues it is about, its description, notices and rows, with the dialogs its actions open. */
  readonly content: ReactNode;
}

const SOURCES: ReadonlySet<string> = new Set([
  'intake',
  'conversation',
  'statusRule',
]);

/** The card, loading the plan by `planId` (or starting from `plan`). */
export function PlanCard({
  planId,
  plan: initial,
  defaultExpanded,
  editable = true,
  linkTitle = true,
  firstIssueId,
  issueHref,
  onChange,
  frame,
  className,
}: PlanCardProps): ReactElement {
  const { t } = usePlanCardText();
  const query = usePlanQuery(planId, initial);
  if (!query.data) {
    if (query.isError)
      return (
        <p
          className={cn(
            'rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground',
            className,
          )}
          data-testid='plan-card'
        >
          {t('planCard.loadFailed')}
        </p>
      );
    return <Skeleton className={cn('h-24 w-full rounded-lg', className)} />;
  }
  return (
    <PlanCardBody
      plan={query.data}
      editable={editable}
      linkTitle={linkTitle}
      {...(firstIssueId ? { firstIssueId } : {})}
      {...(issueHref ? { issueHref } : {})}
      {...(defaultExpanded === undefined ? {} : { defaultExpanded })}
      {...(onChange ? { onChange } : {})}
      {...(frame ? { frame } : {})}
      {...(className ? { className } : {})}
    />
  );
}

function PlanCardBody({
  plan,
  defaultExpanded,
  editable,
  linkTitle,
  firstIssueId,
  issueHref,
  onChange,
  frame,
  className,
}: {
  readonly plan: Plan;
  readonly defaultExpanded?: boolean;
  readonly editable: boolean;
  readonly linkTitle: boolean;
  readonly firstIssueId?: string;
  readonly issueHref?: PlanIssueHref;
  readonly onChange?: (plan: Plan) => void;
  readonly frame?: (parts: PlanCardParts) => ReactElement;
  readonly className?: string;
}): ReactElement {
  const { t, language } = usePlanCardText();
  const notify = usePlanNotify();
  const errors = usePlanErrorText();
  const viewer = useViewer();
  const lookup = usePlanLookup();
  const mutations = usePlanMutations();
  const confirm = usePlanConfirm();
  const words = usePlanWording()(plan);
  const status = effectiveStatus(plan);
  const viewerId = viewer?.userId ?? null;
  const abilities = abilitiesOf(plan, viewerId);
  const countdown = planCountdown(plan, viewerId);
  const [unfolded, setUnfolded] = useState(
    () => defaultExpanded ?? !isClosedPlan(status),
  );
  // In a caller's frame the rows always show.
  const expanded = frame ? true : unfolded;
  const [editing, setEditing] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const views = rowViews(plan.rows);
  const busy = mutations.busy;
  const size = frame ? 'default' : 'sm';

  const changed = (next: Plan) => onChange?.(next);
  const run = (action: PlanAction) =>
    void mutations
      .act(action, plan)
      .then((next) => {
        changed(next);
        if (action === 'void') notify.success(t('planCard.voided'));
        else if (action === 'retry') notify.success(t('planCard.retried'));
        else if (next.status === 'executed')
          notify.success(t('planCard.executed'));
        else notify.error(null, t('planCard.executeFailed'));
      })
      .catch((error: unknown) =>
        notify.error(
          error,
          invalidRows(error) ? t('planCard.retryFailed') : undefined,
        ),
      );

  const source = SOURCES.has(plan.source.kind)
    ? t(`planCard.source.${plan.source.kind}` as PlanCardKey)
    : t('planCard.source.other', { kind: plan.source.kind });
  const failedRowId = plan.failure?.rowId ?? null;
  const failedPosition = plan.rows.find(
    (row) => row.id === failedRowId,
  )?.position;
  const titleId = `plan-${plan.id}-title`;

  const meta = (
    <>
      <PlanStatusTag plan={plan} />
      <span>{t('planCard.rowCount', { count: plan.rows.length })}</span>
      <span>{source}</span>
      {plan.proposerName ? (
        <span>{t('planCard.proposedBy', { name: plan.proposerName })}</span>
      ) : null}
      {plan.deciderUserId !== viewer?.userId && plan.deciderName ? (
        <span>{t('planCard.decidedBy', { name: plan.deciderName })}</span>
      ) : null}
      {status === 'executed' && plan.executedAt ? (
        <span>
          {t('planCard.executedAt', {
            time: relativeTime(plan.executedAt, language),
          })}
        </span>
      ) : null}
      {countdown ? (
        <span>
          {countdown.kind === 'undo'
            ? t('planCard.undoableFor', { hours: countdown.hours })
            : t('planCard.expiresIn', { hours: countdown.hours })}
        </span>
      ) : null}
    </>
  );

  const actions =
    abilities.execute || abilities.retry || abilities.void || abilities.undo ? (
      <>
        {abilities.execute && !editing ? (
          <Button
            size={size}
            disabled={busy}
            data-testid='plan-execute'
            onClick={() => confirm.execute(plan, () => run('execute'))}
          >
            {busy ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <PlayIcon data-icon='inline-start' />
            )}
            {t('planCard.execute')}
          </Button>
        ) : null}
        {abilities.retry && !editing ? (
          <Button
            size={size}
            disabled={busy}
            data-testid='plan-retry'
            onClick={() => run('retry')}
          >
            {busy ? (
              <Spinner data-icon='inline-start' />
            ) : (
              <RotateCcwIcon data-icon='inline-start' />
            )}
            {t('planCard.retry')}
          </Button>
        ) : null}
        {abilities.edit && editable && !editing ? (
          <Button
            size={size}
            variant='outline'
            disabled={busy}
            onClick={() => {
              setUnfolded(true);
              setEditing(true);
            }}
          >
            <PencilIcon data-icon='inline-start' />
            {t('planCard.edit')}
          </Button>
        ) : null}
        {abilities.undo ? (
          <Button
            size={size}
            variant='outline'
            disabled={busy}
            data-testid='plan-undo'
            onClick={() => setUndoing(true)}
          >
            <Undo2Icon data-icon='inline-start' />
            {t('planCard.undo')}
          </Button>
        ) : null}
        {abilities.void && !editing ? (
          <Button
            size={size}
            variant={frame ? 'outline' : 'ghost'}
            className={frame ? undefined : 'ml-auto'}
            disabled={busy}
            data-testid='plan-void'
            onClick={() => confirm.void(() => run('void'))}
          >
            {t('planCard.void')}
          </Button>
        ) : null}
      </>
    ) : null;

  const content = (
    <>
      <PlanIssueLinks
        plan={plan}
        firstIssueId={firstIssueId ?? null}
        {...(issueHref ? { href: issueHref } : {})}
        label={t('planCard.issues')}
      />
      {words.description ? (
        <p className='text-sm whitespace-pre-wrap wrap-anywhere'>
          {words.description}
        </p>
      ) : null}
      {(status === 'stale' || status === 'failed') && plan.failure ? (
        <Alert variant={status === 'failed' ? 'destructive' : 'default'}>
          <AlertTriangleIcon />
          <AlertTitle>
            {status === 'stale'
              ? t('planCard.status.stale')
              : t('planCard.status.failed')}
          </AlertTitle>
          <AlertDescription>
            {status === 'stale'
              ? t('planCard.staleNotice')
              : t('planCard.failedNotice')}
            {status === 'failed' && failedPosition !== undefined ? (
              <span className='block'>
                {t('planCard.failedRow', {
                  position: failedPosition + 1,
                  message: errors.row(plan.failure),
                })}
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      {expanded && plan.skipped.length > 0 ? (
        <div className='space-y-1 text-xs'>
          <p className='font-medium'>{t('planCard.skippedTitle')}</p>
          <ul className='list-disc space-y-0.5 pl-5 text-muted-foreground'>
            {plan.skipped.map((skip) => (
              <li key={skip.rowId}>
                {t(`planCard.skipped.${skip.reason}`)} · {skip.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {expanded && editing && abilities.edit ? (
        <PlanEditor
          plan={plan}
          onSaved={changed}
          onDone={() => setEditing(false)}
        />
      ) : expanded ? (
        <ol className='space-y-1.5' aria-label={t('planCard.rows')}>
          {views.map((view) => (
            <PlanRowItem
              key={view.row.id}
              view={view}
              views={views}
              lookup={lookup}
              failedRowId={failedRowId}
            />
          ))}
        </ol>
      ) : null}
    </>
  );

  const dialogs = (
    <>
      {abilities.undo ? (
        <PlanUndoDialog
          plan={plan}
          open={undoing}
          onOpenChange={setUndoing}
          onUndone={changed}
        />
      ) : null}
      {confirm.dialog}
    </>
  );

  if (frame)
    return frame({
      plan,
      title: words.title,
      href: planHref(plan.id),
      meta,
      actions,
      content: (
        <div
          className={cn('flex flex-col gap-4', className)}
          data-testid='plan-card'
          data-plan-status={status}
        >
          {content}
          {dialogs}
        </div>
      ),
    });

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'space-y-3 rounded-lg border bg-card p-3 text-card-foreground',
        status === 'pending' && 'border-amber-500/40',
        className,
      )}
      data-testid='plan-card'
      data-plan-status={status}
    >
      <header className='flex min-w-0 items-start gap-2'>
        <ClipboardListIcon
          className='mt-0.5 size-4 shrink-0 text-muted-foreground'
          aria-hidden='true'
        />
        <div className='min-w-0 flex-1'>
          <h3 id={titleId} className='text-sm font-semibold wrap-anywhere'>
            {linkTitle ? (
              <Link to={planHref(plan.id)} className='hover:underline'>
                {words.title}
              </Link>
            ) : (
              words.title
            )}
          </h3>
          <p className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
            {meta}
          </p>
        </div>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-expanded={expanded}
          aria-label={expanded ? t('planCard.collapse') : t('planCard.expand')}
          onClick={() => setUnfolded((value) => !value)}
        >
          <ChevronRightIcon
            className={cn('transition-transform', expanded && 'rotate-90')}
          />
        </Button>
      </header>
      {content}
      {actions ? (
        <footer className='flex flex-wrap items-center gap-2'>{actions}</footer>
      ) : null}
      {dialogs}
    </section>
  );
}
