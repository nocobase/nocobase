import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import type { JsonObject } from '@nocobase/lifecycle/react';
import { useTranslation } from '@nocobase/i18n/client';
import { Check, Plus, Trash2, X } from 'lucide-react';

import {
  EXPENSE_CATEGORIES,
  parseItems,
  totalCents,
  yuan,
  type ExpenseItem,
} from '../../shared/expense.js';
import { MANAGERS, person, personName } from '../../shared/people.js';
import { text } from '../../shared/text.js';
import { Choice } from '../components/choice.js';
import { IdentitySelect } from '../components/identity.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import {
  Banner,
  Field,
  LifecyclePanel,
  StateBadge,
} from '../components/record-ui.js';
import { Textarea } from '../components/textarea.js';
import { Button } from '../components/ui/button.js';
import { Card, CardContent } from '../components/ui/card.js';
import { Input } from '../components/ui/input.js';
import { useActorName } from '../lib/actor.js';
import {
  CREATE_TRANSITION,
  errorMessage,
  exampleApi,
  type Plain,
  type RecordDetail,
  type TransitionEntry,
} from '../lib/api.js';
import { ago, countdown, dateTime, NAMESPACE } from '../lib/format.js';
import { useExampleRecord, useTranslate } from '../lib/use-example-record.js';
import { useLoader } from '../lib/use-loader.js';
import { useNow } from '../lib/use-now.js';
import { cn } from '../lib/utils.js';

type Parameters = Readonly<Record<string, unknown>>;

function limit(parameters: Parameters, key: string): number {
  const value = Number(parameters[key]);
  return Number.isFinite(value) ? value : 0;
}

function reportNumber(id: unknown): string {
  return `BX-${text(id).padStart(5, '0')}`;
}

function last(
  transitions: readonly TransitionEntry[],
  name: string,
): TransitionEntry | undefined {
  return [...transitions].reverse().find((entry) => entry.transition === name);
}

export default function ExpensesPage(): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  const client = exampleApi(useApiClient());
  const [actor, setActor] = useState('lin');
  const [selected, setSelected] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState('');
  const isApplicant = person(actor)?.role === 'applicant';
  const view = isApplicant ? 'mine' : 'approvals';

  const list = useLoader(
    () => client.list('expenses', actor, view),
    `expenses:${actor}`,
  );
  const current = useExampleRecord('expenses', selected, actor);
  const records = list.data?.records ?? [];
  const parameters = list.data?.parameters ?? {};

  // Switching to the report's applicant or its approver keeps it open, so
  // one person can walk a report through every hand it passes.
  const switchTo = (id: string): void => {
    const record = current.detail?.record;
    if (record?.applicantId !== id && record?.approverId !== id)
      setSelected(undefined);
    setCreating(false);
    setFlash('');
    setActor(id);
  };

  const reload = async (): Promise<void> => {
    await Promise.all([list.reload(), current.lifecycle.reload()]);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('expenses.title')}
        description={
          isApplicant
            ? t('expenses.applicantDescription', {
                auto: yuan(limit(parameters, 'autoApproveLimit') * 100),
                finance: yuan(limit(parameters, 'financeLimit') * 100),
              })
            : // Only a manager with a manager of their own is passed over.
              person(actor)?.role === 'manager' && MANAGERS[actor]
              ? t('expenses.approverDescription', {
                  minutes: limit(parameters, 'escalateAfterMinutes'),
                })
              : t('expenses.finalApproverDescription')
        }
        actions={
          <IdentitySelect
            value={actor}
            roles={['applicant', 'manager', 'director', 'finance']}
            onChange={switchTo}
          />
        }
      />

      <div className='grid gap-6 lg:grid-cols-[minmax(18rem,24rem)_1fr]'>
        <Card>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <h2 className='font-medium'>
                {isApplicant ? t('expenses.mine') : t('expenses.approvals')}
              </h2>
              {isApplicant ? (
                <Button
                  size='sm'
                  onClick={() => {
                    setCreating(true);
                    setSelected(undefined);
                    setFlash('');
                  }}
                >
                  <Plus />
                  {t('expenses.newReport')}
                </Button>
              ) : null}
            </div>
            {list.error ? (
              <p className='text-sm text-destructive'>{list.error}</p>
            ) : null}
            <ul className='-mx-2 space-y-0.5'>
              {records.map((record) => {
                const id = text(record.id);
                return (
                  <li key={id}>
                    <button
                      type='button'
                      onClick={() => {
                        setSelected(id);
                        setCreating(false);
                        setFlash('');
                      }}
                      className={cn(
                        'w-full rounded-md px-2 py-2 text-left hover:bg-muted',
                        selected === id && 'bg-muted',
                      )}
                    >
                      <div className='flex items-center gap-2'>
                        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                          {text(record.title) || reportNumber(id)}
                        </span>
                        <StateBadge state={text(record.status)} />
                      </div>
                      <div className='mt-1 flex justify-between gap-2 text-xs text-muted-foreground'>
                        <span className='truncate'>
                          {reportNumber(id)}
                          {isApplicant
                            ? ''
                            : ` · ${personName(record.applicantId)}`}{' '}
                          · {ago(record.statusChangedAt, i18n.language)}
                        </span>
                        <span className='font-medium text-foreground tabular-nums'>
                          {yuan(Number(record.amountCents))}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {list.data && !records.length ? (
              <p className='py-6 text-center text-sm text-muted-foreground'>
                {isApplicant
                  ? t('expenses.empty')
                  : t('expenses.emptyApprovals')}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className='min-w-0 space-y-4'>
          {creating ? (
            <Card>
              <CardContent>
                <ExpenseEditor
                  actor={actor}
                  submitWith='submit'
                  submitTo={(id, transition) =>
                    current.lifecycle.client.fire('expenses', id, transition)
                  }
                  onCancel={() => setCreating(false)}
                  onSaved={async (id, error) => {
                    setCreating(false);
                    setSelected(id);
                    setFlash(error);
                    await list.reload();
                  }}
                />
              </CardContent>
            </Card>
          ) : current.detail ? (
            <>
              <ExpenseView
                detail={current.detail}
                fire={current.lifecycle.fire}
                submitTo={(id, transition) =>
                  current.lifecycle.client.fire('expenses', id, transition)
                }
                actor={actor}
                flash={flash}
                onChange={async () => {
                  setFlash('');
                  await reload();
                }}
              />
              <LifecyclePanel
                detail={current.detail}
                actions={current.lifecycle}
                onChange={reload}
              />
            </>
          ) : (
            <Card>
              <CardContent className='py-16 text-center text-sm text-muted-foreground'>
                {current.error || t('expenses.pick')}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

interface Row {
  readonly date: string;
  readonly category: string;
  readonly description: string;
  /** Yuan as typed. */
  readonly amount: string;
}

function toRows(items: readonly ExpenseItem[]): Row[] {
  return items.map((item) => ({
    date: item.date,
    category: item.category,
    description: item.description,
    amount: item.amountCents ? (item.amountCents / 100).toFixed(2) : '',
  }));
}

function toItems(rows: readonly Row[]): ExpenseItem[] {
  return rows.map((row) => ({
    date: row.date,
    category: row.category,
    description: row.description,
    amountCents: Math.round((Number(row.amount) || 0) * 100),
  }));
}

function blankRow(): Row {
  return {
    date: new Date().toISOString().slice(0, 10),
    category: 'transport',
    description: '',
    amount: '',
  };
}

/**
 * Writes a draft, or a report sent back for more information, and submits
 * it. Saving is an ordinary edit; submitting is a transition, which checks
 * the report and decides who approves it.
 */
function ExpenseEditor({
  actor,
  record,
  submitWith,
  submitTo,
  initialError = '',
  onCancel,
  onSaved,
}: {
  readonly actor: string;
  readonly record?: Plain;
  readonly submitWith: 'submit' | 'resubmit';
  /** Fires the submission on a report, which may have just been created. */
  readonly submitTo: (id: string, transition: string) => Promise<unknown>;
  readonly initialError?: string;
  readonly onCancel?: () => void;
  /** Called with the report's id, and the error if submitting it failed. */
  readonly onSaved: (id: string, error: string) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = exampleApi(useApiClient());
  const [title, setTitle] = useState(() => text(record?.title));
  const [purpose, setPurpose] = useState(() => text(record?.purpose));
  const [rows, setRows] = useState<Row[]>(() => {
    const items = toRows(parseItems(record?.items));
    return items.length ? items : [blankRow()];
  });
  const [failPayments, setFailPayments] = useState(
    () => text(record?.failPayments) || '0',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [note, setNote] = useState('');
  const items = toItems(rows);

  const setRow = (index: number, patch: Partial<Row>): void =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const save = async (): Promise<string> => {
    const values = {
      title,
      purpose,
      items,
      failPayments: Number(failPayments),
    };
    if (record) {
      await client.update('expenses', text(record.id), actor, values);
      return text(record.id);
    }
    return text((await client.create('expenses', actor, values)).id);
  };

  const run = async (submit: boolean): Promise<void> => {
    setBusy(true);
    setError('');
    setNote('');
    let id: string | undefined;
    try {
      id = await save();
      if (submit) await submitTo(id, submitWith);
      if (!submit) setNote(t('expenses.editor.saved'));
      await onSaved(id, '');
    } catch (cause) {
      const message = errorMessage(cause, translate);
      if (id && !record) await onSaved(id, message);
      else {
        setError(message);
        // Saved but not submitted: the edit advanced the report's version,
        // so the page reads it again rather than keep the version it had.
        if (id) await onSaved(id, message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='space-y-4'>
      <label className='block space-y-1.5'>
        <span className='text-sm'>{t('expenses.editor.title')}</span>
        <Input
          value={title}
          placeholder={t('expenses.editor.titlePlaceholder')}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className='block space-y-1.5'>
        <span className='text-sm'>{t('expenses.editor.purpose')}</span>
        <Textarea
          rows={2}
          value={purpose}
          placeholder={t('expenses.editor.purposePlaceholder')}
          onChange={(event) => setPurpose(event.target.value)}
        />
      </label>

      <div className='@container space-y-2'>
        <span className='text-sm'>{t('expenses.editor.items')}</span>
        <div className='hidden grid-cols-[8.5rem_8rem_1fr_7rem_2rem] gap-2 text-xs text-muted-foreground @xl:grid'>
          <span>{t('expenses.editor.date')}</span>
          <span>{t('expenses.editor.category')}</span>
          <span>{t('expenses.editor.description')}</span>
          <span className='text-right'>{t('expenses.editor.amount')}</span>
          <span />
        </div>
        {rows.map((row, index) => (
          <div
            // Rows have no identity of their own until saved.
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={index}
            className='grid grid-cols-[1fr_1fr_2rem] gap-2 @xl:grid-cols-[8.5rem_8rem_1fr_7rem_2rem]'
          >
            <Input
              type='date'
              aria-label={t('expenses.editor.date')}
              value={row.date}
              onChange={(event) => setRow(index, { date: event.target.value })}
            />
            <Choice
              label={t('expenses.editor.category')}
              className='col-span-2 w-full @xl:col-span-1'
              value={row.category}
              onChange={(category) => setRow(index, { category })}
              options={EXPENSE_CATEGORIES.map((key) => ({
                value: key,
                label: t(`expenses.categories.${key}`),
              }))}
            />
            <Input
              className='col-span-3 @xl:col-span-1'
              aria-label={t('expenses.editor.description')}
              placeholder={t('expenses.editor.description')}
              value={row.description}
              onChange={(event) =>
                setRow(index, { description: event.target.value })
              }
            />
            <Input
              className='col-span-2 text-right tabular-nums @xl:col-span-1'
              inputMode='decimal'
              aria-label={t('expenses.editor.amount')}
              placeholder={t('expenses.editor.amount')}
              value={row.amount}
              onChange={(event) =>
                setRow(index, { amount: event.target.value })
              }
            />
            <Button
              variant='ghost'
              size='sm'
              aria-label={t('expenses.editor.removeItem')}
              disabled={rows.length === 1}
              onClick={() => setRows(rows.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <div className='flex items-center justify-between'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setRows([...rows, blankRow()])}
          >
            <Plus />
            {t('expenses.editor.addItem')}
          </Button>
          <span className='text-sm'>
            {t('expenses.editor.total')}{' '}
            <span className='text-base font-semibold tabular-nums'>
              {yuan(totalCents(items))}
            </span>
          </span>
        </div>
      </div>

      <details className='rounded-lg bg-muted/50 px-3 py-2 text-sm'>
        <summary className='cursor-pointer text-muted-foreground'>
          {t('common.demoOptions')}
        </summary>
        <label className='mt-2 flex items-center gap-2'>
          <span>{t('expenses.editor.failPayments')}</span>
          <Input
            className='w-20'
            type='number'
            min={0}
            value={failPayments}
            onChange={(event) => setFailPayments(event.target.value)}
          />
        </label>
        <p className='mt-1 text-xs text-muted-foreground'>
          {t('expenses.editor.failHint')}
        </p>
      </details>

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      <div className='flex flex-wrap items-center justify-end gap-2'>
        {note ? (
          <span className='mr-auto text-sm text-muted-foreground'>{note}</span>
        ) : null}
        {onCancel ? (
          <Button variant='ghost' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        ) : null}
        <Button
          variant='outline'
          disabled={busy}
          onClick={() => void run(false)}
        >
          {t('expenses.editor.save')}
        </Button>
        <Button disabled={busy} onClick={() => void run(true)}>
          {t(`expenses.editor.${submitWith}`)}
        </Button>
      </div>
    </div>
  );
}

type StepState = 'done' | 'current' | 'stopped' | 'todo';

function Steps({
  steps,
}: {
  readonly steps: readonly {
    readonly label: string;
    readonly state: StepState;
  }[];
}): ReactElement {
  return (
    <ol className='flex items-center gap-2 text-xs'>
      {steps.map((step, index) => (
        <li key={step.label} className='flex flex-1 items-center gap-2'>
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center rounded-full border',
              step.state === 'done' &&
                'border-emerald-600 bg-emerald-600 text-white',
              step.state === 'current' && 'border-primary text-primary',
              step.state === 'stopped' &&
                'border-destructive bg-destructive text-white',
              step.state === 'todo' && 'text-muted-foreground',
            )}
          >
            {step.state === 'done' ? (
              <Check className='size-3' />
            ) : step.state === 'stopped' ? (
              <X className='size-3' />
            ) : (
              index + 1
            )}
          </span>
          <span
            className={cn(
              'whitespace-nowrap',
              step.state === 'todo' && 'text-muted-foreground',
              step.state === 'current' && 'font-medium text-primary',
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className='h-px flex-1 bg-border' />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function ExpenseView({
  detail,
  fire: fireTransition,
  submitTo,
  actor,
  flash,
  onChange,
}: {
  readonly detail: RecordDetail;
  /** Fires on this report with the version on screen. */
  readonly fire: (transition: string, input?: JsonObject) => Promise<unknown>;
  readonly submitTo: (id: string, transition: string) => Promise<unknown>;
  readonly actor: string;
  readonly flash: string;
  readonly onChange: () => Promise<void>;
}): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const actorName = useActorName();
  const now = useNow();
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const record = detail.record;
  const id = text(record.id);
  const state = text(record.status);
  const amount = Number(record.amountCents);
  const items = parseItems(record.items);
  const { transitions, effectRuns } = detail.history;
  const parameters = detail.parameters;
  const allowed = new Set(
    detail.available.filter((item) => item.allowed).map((item) => item.name),
  );
  const editable =
    actor === record.applicantId &&
    (state === 'draft' || state === 'needsInfo');

  const fire = async (transition: string, input: Plain = {}): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      await fireTransition(transition, input as JsonObject);
      setComment('');
      await onChange();
    } catch (cause) {
      setError(errorMessage(cause, translate));
    } finally {
      setBusy(false);
    }
  };

  // Which approvals this report needs follows from its amount, the same
  // rule the lifecycle routes by.
  const needsManager = amount > limit(parameters, 'autoApproveLimit') * 100;
  const needsFinance = amount > limit(parameters, 'financeLimit') * 100;
  const rejectedAt =
    state === 'rejected' ? last(transitions, 'reject') : undefined;
  const stepState = (step: string): StepState => {
    const order = ['submit', 'manager', 'finance', 'payment'];
    const position: Readonly<Record<string, string>> = {
      draft: 'submit',
      needsInfo: 'submit',
      awaitingManager: 'manager',
      awaitingFinance: 'finance',
      approved: 'payment',
      rejected: rejectedAt?.from === 'awaitingFinance' ? 'finance' : 'manager',
    };
    if (state === 'paid') return 'done';
    const current = order.indexOf(position[state] ?? 'submit');
    const index = order.indexOf(step);
    if (index < current) return 'done';
    if (index > current) return 'todo';
    return state === 'rejected' || state === 'needsInfo'
      ? 'stopped'
      : 'current';
  };
  const steps = [
    { key: 'submit', show: true },
    { key: 'manager', show: needsManager },
    { key: 'finance', show: needsFinance },
    { key: 'payment', show: true },
  ]
    .filter((step) => step.show)
    .map((step) => ({
      label: t(`expenses.steps.${step.key}`),
      state: stepState(step.key),
    }));

  const banner = ((): ReactElement | null => {
    const changedAt = Date.parse(text(record.statusChangedAt));
    if (state === 'draft')
      return <Banner tone='neutral'>{t('expenses.banner.draft')}</Banner>;
    if (state === 'awaitingManager' || state === 'awaitingFinance') {
      const approver = personName(record.approverId);
      // Only a manager who has a manager of their own is passed over.
      if (state === 'awaitingFinance' || !MANAGERS[text(record.approverId)])
        return (
          <Banner tone='warning'>
            {t('expenses.banner.awaitingFinal', { approver })}
          </Banner>
        );
      const left = countdown(
        changedAt + limit(parameters, 'escalateAfterMinutes') * 60_000,
        now,
      );
      return (
        <Banner tone='warning'>
          {left
            ? t('expenses.banner.awaiting', { approver, time: left })
            : t('expenses.banner.overdue')}
        </Banner>
      );
    }
    if (state === 'needsInfo' || state === 'rejected') {
      const entry = last(
        transitions,
        state === 'needsInfo' ? 'requestInfo' : 'reject',
      );
      return (
        <Banner tone='danger'>
          {t(`expenses.banner.${state}`, {
            actor: actorName(entry?.actorId ?? ''),
            reason: text(entry?.input.reason),
          })}
        </Banner>
      );
    }
    if (state === 'approved') {
      const payment = [...effectRuns]
        .reverse()
        .find((run) => run.effect === 'expenses.requestPayment');
      if (
        payment?.status === 'failed' ||
        payment?.status === 'dead' ||
        payment?.status === 'cancelled'
      )
        return (
          <Banner tone='danger'>
            {t('expenses.banner.paymentFailed', {
              attempts: payment.attempts,
              error: payment.error ?? '',
            })}
          </Banner>
        );
      if (payment?.error)
        return (
          <Banner tone='warning'>
            {t('expenses.banner.paymentRetrying', {
              attempts: payment.attempts,
              error: payment.error,
            })}
          </Banner>
        );
      return <Banner tone='info'>{t('expenses.banner.approved')}</Banner>;
    }
    if (state === 'paid')
      return (
        <Banner tone='success'>
          {t('expenses.banner.paid', { ref: text(record.paymentRef) })}
        </Banner>
      );
    return null;
  })();

  const timeline = transitions.map((entry) => {
    const note = text(entry.input.comment) || text(entry.input.reason);
    const lines: string[] = [];
    if (entry.transition === 'escalate')
      lines.push(t('expenses.timeline.escalated'));
    else if (entry.transition === 'paid')
      lines.push(
        `${t('expenses.timeline.paid')} · ${text(entry.input.paymentRef)}`,
      );
    else
      lines.push(
        `${actorName(entry.actorId)} ${t(`transitions.${entry.transition === CREATE_TRANSITION ? 'create' : entry.transition}`)}`,
      );
    if (
      (entry.transition === 'submit' || entry.transition === 'resubmit') &&
      entry.to === 'approved'
    )
      lines.push(
        t('expenses.timeline.autoApproved', {
          limit: yuan(limit(parameters, 'autoApproveLimit') * 100),
        }),
      );
    return { entry, lines, note };
  });

  return (
    <Card>
      <CardContent className='space-y-5'>
        <div className='space-y-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm text-muted-foreground'>
              {reportNumber(id)}
            </span>
            <h2 className='min-w-0 flex-1 text-lg font-medium'>
              {text(record.title) || t('expenses.number', { id })}
            </h2>
            <StateBadge state={state} />
          </div>
          <Steps steps={steps} />
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            <Field label={t('expenses.meta.applicant')}>
              {personName(record.applicantId)} ·{' '}
              {person(record.applicantId)?.title}
            </Field>
            <Field label={t('expenses.meta.total')}>
              <span className='font-semibold tabular-nums'>{yuan(amount)}</span>
            </Field>
            <Field label={t('expenses.meta.approver')}>
              {record.approverId ? personName(record.approverId) : '—'}
            </Field>
            <Field
              label={
                record.paymentRef
                  ? t('expenses.meta.paymentRef')
                  : t('expenses.meta.created')
              }
            >
              {record.paymentRef
                ? text(record.paymentRef)
                : dateTime(record.createdAt, i18n.language)}
            </Field>
          </div>
          {banner}
        </div>

        {editable ? (
          <div className='border-t pt-4'>
            <ExpenseEditor
              // A new state means a fresh form over what was saved.
              key={`${id}:${state}`}
              actor={actor}
              record={record}
              submitWith={state === 'needsInfo' ? 'resubmit' : 'submit'}
              submitTo={submitTo}
              initialError={flash}
              onSaved={onChange}
            />
          </div>
        ) : (
          <>
            {text(record.purpose) ? (
              <p className='text-sm whitespace-pre-wrap text-muted-foreground'>
                {text(record.purpose)}
              </p>
            ) : null}
            <div className='overflow-x-auto'>
              <table className='w-full text-sm'>
                <thead className='text-left text-xs text-muted-foreground'>
                  <tr>
                    <th className='py-1.5 pr-3 font-normal'>
                      {t('expenses.editor.date')}
                    </th>
                    <th className='py-1.5 pr-3 font-normal'>
                      {t('expenses.editor.category')}
                    </th>
                    <th className='py-1.5 pr-3 font-normal'>
                      {t('expenses.editor.description')}
                    </th>
                    <th className='py-1.5 text-right font-normal'>
                      {t('expenses.editor.amount')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <tr key={index} className='border-t'>
                      <td className='py-1.5 pr-3 whitespace-nowrap tabular-nums'>
                        {item.date}
                      </td>
                      <td className='py-1.5 pr-3 whitespace-nowrap'>
                        {t(`expenses.categories.${item.category}`)}
                      </td>
                      <td className='py-1.5 pr-3'>{item.description}</td>
                      <td className='py-1.5 text-right tabular-nums'>
                        {yuan(item.amountCents)}
                      </td>
                    </tr>
                  ))}
                  <tr className='border-t font-medium'>
                    <td className='py-1.5' colSpan={3}>
                      {t('expenses.editor.total')}
                    </td>
                    <td className='py-1.5 text-right tabular-nums'>
                      {yuan(amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className='space-y-2'>
          <h3 className='text-sm font-medium'>
            {t('expenses.timeline.title')}
          </h3>
          {timeline.length ? (
            <ol className='space-y-2 border-l pl-4'>
              {timeline.map(({ entry, lines, note }) => (
                <li key={entry.id} className='relative text-sm'>
                  <span className='absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-border' />
                  <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
                    <span>{lines.join(' · ')}</span>
                    <span className='text-xs text-muted-foreground'>
                      {dateTime(entry.at, i18n.language)}
                    </span>
                  </div>
                  {note ? (
                    <p className='mt-0.5 text-muted-foreground'>“{note}”</p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t('expenses.timeline.empty')}
            </p>
          )}
        </div>

        {allowed.has('approve') ? (
          <div className='space-y-2 rounded-lg border p-3'>
            <h3 className='text-sm font-medium'>
              {t('expenses.decision.title')}
            </h3>
            <Textarea
              rows={2}
              value={comment}
              placeholder={t('expenses.decision.placeholder')}
              onChange={(event) => setComment(event.target.value)}
            />
            <div className='flex flex-wrap justify-end gap-2'>
              <Button
                variant='destructive'
                disabled={busy || !comment.trim()}
                onClick={() => void fire('reject', { reason: comment })}
              >
                {t('expenses.decision.reject')}
              </Button>
              <Button
                variant='outline'
                disabled={busy || !comment.trim()}
                onClick={() => void fire('requestInfo', { reason: comment })}
              >
                {t('expenses.decision.requestInfo')}
              </Button>
              <Button
                disabled={busy}
                onClick={() =>
                  void fire('approve', comment.trim() ? { comment } : {})
                }
              >
                {t('expenses.decision.approve')}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        {allowed.has('withdraw') && !editable ? (
          <div className='flex justify-end'>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => void fire('withdraw')}
            >
              {t('expenses.withdraw')}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
