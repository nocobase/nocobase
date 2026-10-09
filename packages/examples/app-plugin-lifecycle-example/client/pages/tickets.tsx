import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import type { JsonObject } from '@nocobase/lifecycle/react';
import { useTranslation } from '@nocobase/i18n/client';
import { Plus } from 'lucide-react';

import { person, personName } from '../../shared/people.js';
import { text } from '../../shared/text.js';
import { PRIORITIES, TICKET_CATEGORIES } from '../../shared/ticket.js';
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
  errorMessage,
  exampleApi,
  type EffectRun,
  type Plain,
  type RecordDetail,
} from '../lib/api.js';
import { ago, countdown, dateTime, NAMESPACE } from '../lib/format.js';
import { useExampleRecord, useTranslate } from '../lib/use-example-record.js';
import { useLoader } from '../lib/use-loader.js';
import { useNow } from '../lib/use-now.js';
import { cn } from '../lib/utils.js';

const FILTERS = ['all', 'new', 'open', 'awaitingCustomer', 'closed'] as const;
type Filter = (typeof FILTERS)[number];

const PRIORITY_DOTS: Readonly<Record<string, string>> = {
  low: 'bg-muted-foreground/40',
  normal: 'bg-primary/60',
  high: 'bg-amber-500',
  urgent: 'bg-destructive',
};

function PriorityDot({
  priority,
}: {
  readonly priority: string;
}): ReactElement {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        PRIORITY_DOTS[priority] ?? PRIORITY_DOTS.normal,
      )}
    />
  );
}

function number(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function TicketsPage(): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  const client = exampleApi(useApiClient());
  const [actor, setActor] = useState('agent-zhou');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const isAgent = person(actor)?.role === 'agent';

  const list = useLoader(
    () => client.list('tickets', actor),
    `tickets:${actor}`,
  );
  const current = useExampleRecord('tickets', selected, actor);
  const records = list.data?.records ?? [];
  const parameters = list.data?.parameters ?? {};
  const shown =
    filter === 'all'
      ? records
      : records.filter((record) => record.status === filter);

  // Switching to the ticket's own customer keeps it open, which is how
  // one person plays both sides of the conversation.
  const switchTo = (id: string): void => {
    const requester = current.detail?.record.requesterId;
    if (person(id)?.role !== 'agent' && requester !== id)
      setSelected(undefined);
    setCreating(false);
    setActor(id);
  };

  const reload = async (): Promise<void> => {
    await Promise.all([list.reload(), current.lifecycle.reload()]);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('tickets.title')}
        description={
          isAgent
            ? t('tickets.agentDescription')
            : t('tickets.customerDescription', {
                days: number(parameters.reopenDays, 7),
              })
        }
        actions={
          <IdentitySelect
            value={actor}
            roles={['agent', 'customer']}
            onChange={switchTo}
          />
        }
      />

      <div className='grid gap-6 lg:grid-cols-[minmax(18rem,24rem)_1fr]'>
        <Card>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <h2 className='font-medium'>
                {isAgent ? t('tickets.queue') : t('tickets.mine')}
              </h2>
              {isAgent ? null : (
                <Button
                  size='sm'
                  onClick={() => {
                    setCreating(true);
                    setSelected(undefined);
                  }}
                >
                  <Plus />
                  {t('tickets.newTicket')}
                </Button>
              )}
            </div>
            {isAgent ? (
              <div className='flex flex-wrap gap-1'>
                {FILTERS.map((key) => {
                  const count =
                    key === 'all'
                      ? records.length
                      : records.filter((record) => record.status === key)
                          .length;
                  return (
                    <button
                      key={key}
                      type='button'
                      onClick={() => setFilter(key)}
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs',
                        filter === key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t(`tickets.filters.${key}`)} {count}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {list.error ? (
              <p className='text-sm text-destructive'>{list.error}</p>
            ) : null}
            <ul className='-mx-2 space-y-0.5'>
              {(isAgent ? shown : records).map((record) => {
                const id = text(record.id);
                return (
                  <li key={id}>
                    <button
                      type='button'
                      onClick={() => {
                        setSelected(id);
                        setCreating(false);
                      }}
                      className={cn(
                        'w-full rounded-md px-2 py-2 text-left hover:bg-muted',
                        selected === id && 'bg-muted',
                      )}
                    >
                      <div className='flex items-center gap-2'>
                        <PriorityDot priority={text(record.priority)} />
                        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                          {text(record.subject)}
                        </span>
                        <StateBadge state={text(record.status)} />
                      </div>
                      <div className='mt-1 truncate pl-4 text-xs text-muted-foreground'>
                        #{id} · {personName(record.requesterId)} ·{' '}
                        {t(`tickets.categories.${text(record.category)}`)} ·{' '}
                        {ago(record.statusChangedAt, i18n.language)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {list.data && !(isAgent ? shown : records).length ? (
              <p className='py-6 text-center text-sm text-muted-foreground'>
                {t('tickets.empty')}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className='min-w-0 space-y-4'>
          {creating ? (
            <NewTicket
              actor={actor}
              onCancel={() => setCreating(false)}
              onCreated={async (id) => {
                setCreating(false);
                setSelected(id);
                await list.reload();
              }}
            />
          ) : current.detail ? (
            <>
              <TicketView
                detail={current.detail}
                fire={current.lifecycle.fire}
                actor={actor}
                onChange={reload}
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
                {current.error || t('tickets.pick')}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

function NewTicket({
  actor,
  onCancel,
  onCreated,
}: {
  readonly actor: string;
  readonly onCancel: () => void;
  readonly onCreated: (id: string) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const client = exampleApi(useApiClient());
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('account');
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [failNotifications, setFailNotifications] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      const created = await client.create('tickets', actor, {
        subject,
        category,
        priority,
        description,
        failNotifications: Number(failNotifications),
      });
      await onCreated(text(created.id));
    } catch (cause) {
      setError(errorMessage(cause, translate));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className='space-y-4'>
        <h2 className='text-lg font-medium'>{t('tickets.form.title')}</h2>
        <label className='block space-y-1.5'>
          <span className='text-sm'>{t('tickets.form.subject')}</span>
          <Input
            value={subject}
            placeholder={t('tickets.form.subjectPlaceholder')}
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='space-y-1.5'>
            <span className='text-sm'>{t('tickets.form.category')}</span>
            <Choice
              label={t('tickets.form.category')}
              className='w-full'
              value={category}
              onChange={setCategory}
              options={TICKET_CATEGORIES.map((key) => ({
                value: key,
                label: t(`tickets.categories.${key}`),
              }))}
            />
          </div>
          <div className='space-y-1.5'>
            <span className='text-sm'>{t('tickets.form.priority')}</span>
            <Choice
              label={t('tickets.form.priority')}
              className='w-full'
              value={priority}
              onChange={setPriority}
              options={PRIORITIES.map((key) => ({
                value: key,
                label: t(`tickets.priorities.${key}`),
              }))}
            />
          </div>
        </div>
        <label className='block space-y-1.5'>
          <span className='text-sm'>{t('tickets.form.description')}</span>
          <Textarea
            rows={5}
            value={description}
            placeholder={t('tickets.form.descriptionPlaceholder')}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <details className='rounded-lg bg-muted/50 px-3 py-2 text-sm'>
          <summary className='cursor-pointer text-muted-foreground'>
            {t('common.demoOptions')}
          </summary>
          <label className='mt-2 flex items-center gap-2'>
            <span>{t('tickets.form.failNotifications')}</span>
            <Input
              className='w-20'
              type='number'
              min={0}
              value={failNotifications}
              onChange={(event) => setFailNotifications(event.target.value)}
            />
          </label>
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('tickets.form.failHint')}
          </p>
        </details>
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {t('tickets.form.submit')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type ThreadItem =
  | {
      readonly kind: 'message';
      readonly id: string;
      readonly author: string;
      readonly body: string;
      readonly at: string;
      readonly delivery?: EffectRun;
    }
  | { readonly kind: 'event'; readonly id: string; readonly text: string };

function TicketView({
  detail,
  fire: fireTransition,
  actor,
  onChange,
}: {
  readonly detail: RecordDetail;
  /** Fires on this ticket with the version on screen. */
  readonly fire: (transition: string, input?: JsonObject) => Promise<unknown>;
  readonly actor: string;
  readonly onChange: () => Promise<void>;
}): ReactElement {
  const { t, i18n } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const actorName = useActorName();
  const now = useNow();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const record: Plain = detail.record;
  const id = text(record.id);
  const state = text(record.status);
  const waitMinutes = number(detail.parameters.waitMinutes, 0);
  const reopenDays = number(detail.parameters.reopenDays, 0);
  const changedAt = Date.parse(text(record.statusChangedAt));
  const allowed = new Set(
    detail.available.filter((item) => item.allowed).map((item) => item.name),
  );
  const isAgent = person(actor)?.role === 'agent';

  // The conversation is the transition log: each reply is the input of the
  // transition it caused, and the email it sent is that transition's effect.
  const thread: ThreadItem[] = [
    {
      kind: 'message',
      id: 'opening',
      author: text(record.requesterId),
      body: text(record.description),
      at: text(record.createdAt),
    },
  ];
  for (const entry of detail.history.transitions) {
    const who = actorName(entry.actorId);
    if (entry.transition === 'accept')
      thread.push({
        kind: 'event',
        id: entry.id,
        text: t('tickets.thread.accept', { actor: who }),
      });
    if (entry.transition === 'resolve')
      thread.push({
        kind: 'event',
        id: entry.id,
        text: t('tickets.thread.resolve', { actor: who }),
      });
    if (entry.transition === 'autoClose')
      thread.push({
        kind: 'event',
        id: entry.id,
        text: t('tickets.thread.autoClose', { minutes: waitMinutes }),
      });
    if (entry.transition === 'reopen')
      thread.push({
        kind: 'event',
        id: `${entry.id}:event`,
        text: t('tickets.thread.reopen', { actor: who }),
      });
    const body = text(entry.input.message);
    if (body) {
      const delivery = detail.history.effectRuns.find(
        (run) =>
          run.transitionId === entry.id &&
          run.effect === 'tickets.notifyCustomer',
      );
      thread.push({
        kind: 'message',
        id: entry.id,
        author: entry.actorId,
        body,
        at: entry.at,
        ...(delivery ? { delivery } : {}),
      });
    }
  }

  const fire = async (transition: string, input: Plain = {}): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      await fireTransition(transition, input as JsonObject);
      setMessage('');
      await onChange();
    } catch (cause) {
      setError(errorMessage(cause, translate));
    } finally {
      setBusy(false);
    }
  };

  const banner = ((): ReactElement => {
    if (state === 'new')
      return <Banner tone='info'>{t('tickets.banner.new')}</Banner>;
    if (state === 'open')
      return (
        <Banner tone='warning'>
          {t('tickets.banner.open', {
            assignee: personName(record.assigneeId),
          })}
        </Banner>
      );
    if (state === 'awaitingCustomer') {
      const left = countdown(changedAt + waitMinutes * 60_000, now);
      return (
        <Banner tone='neutral'>
          {left
            ? t('tickets.banner.awaiting', { time: left })
            : t('tickets.banner.overdue')}
        </Banner>
      );
    }
    const until = changedAt + reopenDays * 86_400_000;
    return (
      <Banner tone='success'>
        {record.closedReason === 'timeout'
          ? t('tickets.banner.timeout')
          : t('tickets.banner.resolved')}{' '}
        {until > now
          ? t('tickets.banner.reopenUntil', {
              date: dateTime(new Date(until).toISOString(), i18n.language),
            })
          : t('tickets.banner.reopenExpired')}
      </Banner>
    );
  })();

  const deliveryText = (run: EffectRun): string => {
    if (
      run.status === 'failed' ||
      run.status === 'dead' ||
      run.status === 'cancelled'
    )
      return t('tickets.thread.delivery.failed', {
        attempts: run.attempts,
        error: run.error ?? '',
      });
    if (run.status === 'queued' && run.error)
      return t('tickets.thread.delivery.retrying', {
        attempts: run.attempts,
        error: run.error,
      });
    return t(`tickets.thread.delivery.${run.status}`);
  };

  const writes = isAgent
    ? allowed.has('reply')
    : allowed.has('customerReply') || allowed.has('reopen');
  const placeholder = isAgent
    ? t('tickets.composer.agentPlaceholder')
    : allowed.has('reopen')
      ? t('tickets.composer.reopenPlaceholder')
      : t('tickets.composer.customerPlaceholder');

  return (
    <Card>
      <CardContent className='space-y-5'>
        <div className='space-y-3'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm text-muted-foreground'>#{id}</span>
            <h2 className='min-w-0 flex-1 text-lg font-medium'>
              {text(record.subject)}
            </h2>
            <StateBadge state={state} />
          </div>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5'>
            <Field label={t('tickets.meta.customer')}>
              {personName(record.requesterId)} ·{' '}
              {person(record.requesterId)?.title}
            </Field>
            <Field label={t('tickets.meta.category')}>
              {t(`tickets.categories.${text(record.category)}`)}
            </Field>
            <Field label={t('tickets.meta.priority')}>
              <span className='inline-flex items-center gap-1.5'>
                <PriorityDot priority={text(record.priority)} />
                {t(`tickets.priorities.${text(record.priority)}`)}
              </span>
            </Field>
            <Field label={t('tickets.meta.assignee')}>
              {record.assigneeId
                ? personName(record.assigneeId)
                : t('common.unassigned')}
            </Field>
            <Field label={t('tickets.meta.created')}>
              {dateTime(record.createdAt, i18n.language)}
            </Field>
          </div>
          {banner}
        </div>

        <ol className='space-y-3'>
          {thread.map((item) =>
            item.kind === 'event' ? (
              <li
                key={item.id}
                className='flex items-center gap-3 text-xs text-muted-foreground'
              >
                <span className='h-px flex-1 bg-border' />
                {item.text}
                <span className='h-px flex-1 bg-border' />
              </li>
            ) : (
              <li
                key={item.id}
                className={cn(
                  'flex flex-col',
                  item.author === actor ? 'items-end' : 'items-start',
                )}
              >
                <span className='mb-1 text-xs text-muted-foreground'>
                  {t('tickets.thread.wrote', {
                    name: actorName(item.author),
                    time: dateTime(item.at, i18n.language),
                  })}
                </span>
                <div
                  className={cn(
                    'max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap',
                    person(item.author)?.role === 'agent'
                      ? 'bg-primary/10'
                      : 'bg-muted',
                  )}
                >
                  {item.body}
                </div>
                {item.delivery ? (
                  <span
                    className={cn(
                      'mt-1 text-xs',
                      item.delivery.error
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                    )}
                  >
                    {deliveryText(item.delivery)}
                  </span>
                ) : null}
              </li>
            ),
          )}
        </ol>

        <div className='space-y-2 border-t pt-4'>
          {writes ? (
            <Textarea
              rows={3}
              value={message}
              placeholder={placeholder}
              onChange={(event) => setMessage(event.target.value)}
            />
          ) : null}
          {error ? <p className='text-sm text-destructive'>{error}</p> : null}
          <div className='flex flex-wrap justify-end gap-2'>
            {isAgent && allowed.has('accept') ? (
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => void fire('accept')}
              >
                {t('tickets.composer.accept')}
              </Button>
            ) : null}
            {isAgent && allowed.has('resolve') ? (
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => void fire('resolve')}
              >
                {t('tickets.composer.resolve')}
              </Button>
            ) : null}
            {(['reply', 'customerReply', 'reopen'] as const)
              .filter((name) => allowed.has(name))
              .map((name) => (
                <Button
                  key={name}
                  disabled={busy || !message.trim()}
                  onClick={() => void fire(name, { message })}
                >
                  {t(`tickets.composer.${name}`)}
                </Button>
              ))}
          </div>
          {!allowed.size ? (
            <p className='text-right text-sm text-muted-foreground'>
              {t('tickets.composer.nothing')}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
