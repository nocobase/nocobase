import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  PencilIcon,
  PlayIcon,
  RotateCcwIcon,
  Undo2Icon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import type { Plan } from '../../../shared/plans.js';
import { PmTag } from '../../components/pm-tag.js';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert.js';
import { Button } from '../../components/ui/button.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { Spinner } from '../../components/ui/spinner.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { usePmFormatters } from '../../lib/format.js';
import { cn } from 'cn';
import { usePlanLookup } from './lookup.js';
import {
  abilitiesOf,
  effectiveStatus,
  isClosedPlan,
  planCountdown,
  planHref,
  rowViews,
} from './model.js';
import { usePlanConfirm } from './plan-confirm.js';
import { PlanEditor } from './plan-editor.js';
import { PlanRowItem } from './plan-row.js';
import { PlanUndoDialog } from './plan-undo.js';
import {
  PLAN_STATUS_TONE,
  usePlanSource,
  usePlanWording,
} from './plan-text.js';
import { invalidRows, usePlanMutations, usePlanQuery } from './use-plan.js';

export interface PlanCardProps {
  readonly planId: string;
  /** The plan, when the caller has it already; the card keeps it current. */
  readonly plan?: Plan;
  /** Whether the rows show at first; closed plans (voided, expired, undone) fold by default. */
  readonly defaultExpanded?: boolean;
  /** Offers editing an open plan's rows in place. Defaults to true. */
  readonly editable?: boolean;
  /** Links the title to the plan's page (`/issues/plans/:id`). Defaults to true. */
  readonly linkTitle?: boolean;
  /** Called with the plan after each action. */
  readonly onChange?: (plan: Plan) => void;
  readonly className?: string;
}

/** The status tag of a plan, with a voided plan's reason. */
export function PlanStatusTag({ plan }: { readonly plan: Plan }): ReactElement {
  const { t } = useTranslation();
  const status = effectiveStatus(plan);
  return (
    <PmTag tone={PLAN_STATUS_TONE[status]} dot>
      {status === 'voided' && plan.voidReason === 'superseded'
        ? t('plans.superseded')
        : t(`plans.status.${status}`)}
    </PmTag>
  );
}

/**
 * An operation plan (`shared/plans.ts`) as a card: what it changes row by row — whom each row wakes and what it risks —
 * and what can be done with it now. A pending plan executes (asking once more when a row is risky) or is voided; a
 * failed or stale one is checked again; an executed one can be undone within the undo window, in one step after a
 * preview of what will be reverted (`plan-undo.tsx`). An open plan's rows can be edited in place. The card refetches when the
 * server announces a plan change.
 */
export function PlanCard({
  planId,
  plan: initial,
  defaultExpanded,
  editable = true,
  linkTitle = true,
  onChange,
  className,
}: PlanCardProps): ReactElement {
  const { t } = useTranslation();
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
          {t('plans.loadFailed')}
        </p>
      );
    return <Skeleton className={cn('h-24 w-full rounded-lg', className)} />;
  }
  return (
    <PlanCardBody
      plan={query.data}
      defaultExpanded={defaultExpanded}
      editable={editable}
      linkTitle={linkTitle}
      onChange={onChange}
      className={className}
    />
  );
}

function PlanCardBody({
  plan,
  defaultExpanded,
  editable,
  linkTitle,
  onChange,
  className,
}: {
  readonly plan: Plan;
  readonly defaultExpanded?: boolean;
  readonly editable: boolean;
  readonly linkTitle: boolean;
  readonly onChange?: (plan: Plan) => void;
  readonly className?: string;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const viewer = useViewer();
  const lookup = usePlanLookup();
  const format = usePmFormatters();
  const mutations = usePlanMutations();
  const confirm = usePlanConfirm();
  const sourceText = usePlanSource();
  const words = usePlanWording()(plan);
  const status = effectiveStatus(plan);
  const abilities = abilitiesOf(plan, viewer?.userId ?? null);
  const [expanded, setExpanded] = useState(
    () => defaultExpanded ?? !isClosedPlan(status),
  );
  const [editing, setEditing] = useState(false);
  const views = rowViews(plan.rows);
  const busy = mutations.busy;
  const [undoing, setUndoing] = useState(false);

  const changed = (next: Plan) => onChange?.(next);
  const run = (action: 'execute' | 'retry' | 'void') =>
    void mutations
      .act(action, plan)
      .then((next) => {
        changed(next);
        if (action === 'void') notify.success(t('plans.voided'));
        else if (action === 'retry') notify.success(t('plans.retried'));
        else if (next.status === 'executed')
          notify.success(t('plans.executed'));
        else notify.error(null, t('plans.executeFailed'));
      })
      .catch((error: unknown) =>
        notify.error(
          error,
          invalidRows(error) ? t('plans.retryFailed') : undefined,
        ),
      );

  const countdown = planCountdown(plan, viewer?.userId ?? null);
  const failedRowId = plan.failure?.rowId ?? null;
  const failedPosition = plan.rows.find(
    (row) => row.id === failedRowId,
  )?.position;
  const titleId = `plan-${plan.id}-title`;

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
            <PlanStatusTag plan={plan} />
            <span>{t('plans.rowCount', { count: plan.rows.length })}</span>
            <span>{sourceText(plan)}</span>
            {plan.proposerName ? (
              <span>{t('plans.proposedBy', { name: plan.proposerName })}</span>
            ) : null}
            {plan.deciderUserId !== viewer?.userId && plan.deciderName ? (
              <span>{t('plans.decidedBy', { name: plan.deciderName })}</span>
            ) : null}
            {status === 'executed' && plan.executedAt ? (
              <span>
                {t('plans.executedAt', {
                  time: format.relative(plan.executedAt),
                })}
              </span>
            ) : null}
            {countdown ? (
              <span>
                {countdown.kind === 'undo'
                  ? t('plans.undoableFor', { hours: countdown.hours })
                  : t('plans.expiresIn', { hours: countdown.hours })}
              </span>
            ) : null}
          </p>
        </div>
        <Button
          variant='ghost'
          size='icon-sm'
          aria-expanded={expanded}
          aria-label={expanded ? t('plans.collapse') : t('plans.expand')}
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronRightIcon
            className={cn('transition-transform', expanded && 'rotate-90')}
          />
        </Button>
      </header>
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
              ? t('plans.status.stale')
              : t('plans.status.failed')}
          </AlertTitle>
          <AlertDescription>
            {status === 'stale'
              ? t('plans.staleNotice')
              : t('plans.failedNotice')}
            {status === 'failed' && failedPosition !== undefined ? (
              <span className='block'>
                {t('plans.failedRow', {
                  position: failedPosition + 1,
                  message: t(`errors.${plan.failure.code}`, {
                    defaultValue: plan.failure.message,
                  }),
                })}
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      {expanded && plan.skipped.length > 0 ? (
        <div className='space-y-1 text-xs'>
          <p className='font-medium'>{t('plans.skippedTitle')}</p>
          <ul className='list-disc space-y-0.5 pl-5 text-muted-foreground'>
            {plan.skipped.map((skip) => (
              <li key={skip.rowId}>
                {t(`plans.skipped.${skip.reason}`)} · {skip.message}
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
        <ol className='space-y-1.5' aria-label={t('plans.rows')}>
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
      {abilities.execute ||
      abilities.retry ||
      abilities.void ||
      abilities.undo ? (
        <footer className='flex flex-wrap items-center gap-2'>
          {abilities.execute && !editing ? (
            <Button
              size='sm'
              disabled={busy}
              data-testid='plan-execute'
              onClick={() => confirm.execute(plan, () => run('execute'))}
            >
              {busy ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <PlayIcon data-icon='inline-start' />
              )}
              {t('plans.execute')}
            </Button>
          ) : null}
          {abilities.retry && !editing ? (
            <Button
              size='sm'
              disabled={busy}
              data-testid='plan-retry'
              onClick={() => run('retry')}
            >
              {busy ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <RotateCcwIcon data-icon='inline-start' />
              )}
              {t('plans.retry')}
            </Button>
          ) : null}
          {abilities.edit && editable && !editing ? (
            <Button
              size='sm'
              variant='outline'
              disabled={busy}
              onClick={() => {
                setExpanded(true);
                setEditing(true);
              }}
            >
              <PencilIcon data-icon='inline-start' />
              {t('plans.edit')}
            </Button>
          ) : null}
          {abilities.undo ? (
            <Button
              size='sm'
              variant='outline'
              disabled={busy}
              data-testid='plan-undo'
              onClick={() => setUndoing(true)}
            >
              <Undo2Icon data-icon='inline-start' />
              {t('plans.undo')}
            </Button>
          ) : null}
          {abilities.void && !editing ? (
            <Button
              size='sm'
              variant='ghost'
              className='ml-auto'
              disabled={busy}
              onClick={() => confirm.void(() => run('void'))}
            >
              {t('plans.void')}
            </Button>
          ) : null}
        </footer>
      ) : null}
      {abilities.undo ? (
        <PlanUndoDialog
          plan={plan}
          open={undoing}
          onOpenChange={setUndoing}
          onUndone={changed}
        />
      ) : null}
      {confirm.dialog}
    </section>
  );
}
