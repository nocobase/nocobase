import { SearchIcon, TriangleAlertIcon, XIcon } from 'lucide-react';
import { useState, type FormEvent, type ReactElement } from 'react';

import { Alert, AlertDescription } from '../components/ui/alert.js';
import { Button } from '../components/ui/button.js';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '../components/ui/collapsible.js';
import { Input } from '../components/ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet.js';
import { Textarea } from '../components/ui/textarea.js';
import {
  failureMessage,
  formatTime,
  requestFailure,
  useNotificationText,
} from '../text.js';
import {
  DELIVERY_OUTCOMES,
  type NotificationDeliveryFilter,
  type NotificationDeliveryLogDetails,
  type NotificationDeliveryLogEntry,
  type NotificationDeliveryOutcome,
  type NotificationDeliveryPage,
} from './api.js';
import {
  useCanManageNotifications,
  useLoaded,
  useSettingsApi,
} from './hooks.js';
import { LoadState, StatusBadge } from './shared.js';

/** The outcome chips the log offers first: the ones that need someone. */
const CHIPS: readonly NotificationDeliveryOutcome[] = [
  'failed',
  'retrying',
  'unknown',
];
const RANGES = ['24h', '7d', '30d', 'all'] as const;
type Range = (typeof RANGES)[number];
const RANGE_MS: Readonly<Record<Range, number | null>> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  all: null,
};

export interface DeliveriesTabProps {
  readonly filter: NotificationDeliveryFilter & { readonly range?: string };
  readonly onFilterChange: (
    filter: NotificationDeliveryFilter & { readonly range?: string },
  ) => void;
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
}

/** The delivery log: one row per channel delivery, filtered and paged by cursor. */
export function DeliveriesTab({
  filter,
  onFilterChange,
  selectedId,
  onSelect,
}: DeliveriesTabProps): ReactElement {
  const api = useSettingsApi();
  const { t, text, language } = useNotificationText();
  const range: Range = RANGES.includes(filter.range as Range)
    ? (filter.range as Range)
    : '7d';
  const [now] = useState(() => Date.now());
  const span = RANGE_MS[range];
  const query: NotificationDeliveryFilter = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.channel ? { channel: filter.channel } : {}),
    ...(filter.kind ? { kind: filter.kind } : {}),
    ...(filter.q ? { q: filter.q } : {}),
    ...(span === null ? {} : { from: new Date(now - span).toISOString() }),
  };
  const key = JSON.stringify(query);
  const [first, reload] = useLoaded(() => api.deliveries(query), key);
  const [more, setMore] = useState<{
    readonly key: string;
    readonly pages: readonly NotificationDeliveryPage[];
    readonly loading: boolean;
    readonly error?: string;
  }>({ key, pages: [], loading: false });
  const pages = more.key === key ? more.pages : [];
  const [channels] = useLoaded(() => api.channels(), 'channels');
  const [kinds] = useLoaded(() => api.kinds(), 'kinds');
  const [search, setSearch] = useState(filter.q ?? '');
  // Follow a search the URL changes (back, a link) without an effect.
  const [searched, setSearched] = useState(filter.q);
  if (searched !== filter.q) {
    setSearched(filter.q);
    setSearch(filter.q ?? '');
  }
  const set = (change: Partial<DeliveriesTabProps['filter']>) =>
    onFilterChange({ ...filter, ...change });
  const last =
    pages.at(-1) ?? (first.state === 'ready' ? first.data : undefined);
  const loadMore = () => {
    const token = last?.meta.nextPageToken;
    if (!token) return;
    setMore({ key, pages, loading: true });
    api.deliveries(query, token).then(
      (page) => setMore({ key, pages: [...pages, page], loading: false }),
      (cause: unknown) =>
        setMore({
          key,
          pages,
          loading: false,
          error: failureMessage(cause, t('settings.errors.failed')),
        }),
    );
  };
  const counts = first.state === 'ready' ? first.data.meta.statusCounts : {};
  const rows: readonly NotificationDeliveryLogEntry[] =
    first.state === 'ready'
      ? [first.data, ...pages].flatMap((page) => page.data)
      : [];
  const kindName = (id: string | undefined) => {
    if (!id) return undefined;
    const found =
      kinds.state === 'ready'
        ? kinds.data.find((kind) => kind.id === id)
        : undefined;
    return found ? text(found.name) : id;
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    set({ q: search.trim() || undefined });
  };
  const channelValue = filter.channel ?? 'all';
  const kindValue = filter.kind ?? 'all';
  return (
    <div className='min-w-0 space-y-4'>
      <div
        role='toolbar'
        aria-label={t('deliveries.filters')}
        className='flex flex-wrap items-center gap-2'
      >
        <div
          role='group'
          aria-label={t('deliveries.outcome')}
          className='flex flex-wrap gap-1.5'
        >
          <Button
            size='sm'
            variant={filter.status ? 'outline' : 'secondary'}
            aria-pressed={!filter.status}
            onClick={() => set({ status: undefined })}
          >
            {t('deliveries.all')}
          </Button>
          {[
            ...CHIPS,
            ...DELIVERY_OUTCOMES.filter((item) => !CHIPS.includes(item)),
          ].map((outcome) => (
            <Button
              key={outcome}
              size='sm'
              variant={filter.status === outcome ? 'secondary' : 'outline'}
              aria-pressed={filter.status === outcome}
              onClick={() =>
                set({ status: filter.status === outcome ? undefined : outcome })
              }
            >
              {t(`deliveries.outcomes.${outcome}`)}
              <span className='text-muted-foreground tabular-nums'>
                {counts[outcome] ?? 0}
              </span>
            </Button>
          ))}
        </div>
        <Select
          value={channelValue}
          onValueChange={(value) =>
            set({ channel: !value || value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger aria-label={t('deliveries.channel')} size='sm'>
            <span className='text-muted-foreground'>
              {t('deliveries.channel')}
            </span>
            <SelectValue>
              {channelValue === 'all' ? t('deliveries.all') : channelValue}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('deliveries.all')}</SelectItem>
            {channels.state === 'ready'
              ? channels.data.data.map((channel) => (
                  <SelectItem key={channel.name} value={channel.name}>
                    {channel.name}
                  </SelectItem>
                ))
              : null}
          </SelectContent>
        </Select>
        <Select
          value={kindValue}
          onValueChange={(value) =>
            set({ kind: !value || value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger aria-label={t('deliveries.kind')} size='sm'>
            <span className='text-muted-foreground'>
              {t('deliveries.kind')}
            </span>
            <SelectValue>
              {kindValue === 'all' ? t('deliveries.all') : kindName(kindValue)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('deliveries.all')}</SelectItem>
            {kinds.state === 'ready'
              ? kinds.data.map((kind) => (
                  <SelectItem key={kind.id} value={kind.id}>
                    {text(kind.name)}
                  </SelectItem>
                ))
              : null}
          </SelectContent>
        </Select>
        <Select
          value={range}
          onValueChange={(value) => set({ range: value ?? undefined })}
        >
          <SelectTrigger aria-label={t('deliveries.time')} size='sm'>
            <SelectValue>{t(`deliveries.ranges.${range}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(`deliveries.ranges.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <form
          role='search'
          onSubmit={submitSearch}
          className='relative w-full sm:w-64'
        >
          <SearchIcon
            aria-hidden
            className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'
          />
          <Input
            type='search'
            className='pl-8'
            aria-label={t('deliveries.search')}
            placeholder={t('deliveries.search')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onBlur={() => {
              if ((filter.q ?? '') !== search.trim())
                set({ q: search.trim() || undefined });
            }}
          />
        </form>
      </div>
      {first.state !== 'ready' ? (
        <LoadState loaded={first} onRetry={reload} />
      ) : rows.length ? (
        <>
          <div className='overflow-x-auto rounded-lg border'>
            <table className='w-full min-w-[44rem] text-sm'>
              <thead className='text-left text-xs text-muted-foreground'>
                <tr className='border-b'>
                  <th className='px-3 py-2 font-medium'>
                    {t('deliveries.columns.time')}
                  </th>
                  <th className='px-3 py-2 font-medium'>
                    {t('deliveries.columns.notification')}
                  </th>
                  <th className='px-3 py-2 font-medium'>
                    {t('deliveries.columns.channel')}
                  </th>
                  <th className='px-3 py-2 font-medium'>
                    {t('deliveries.columns.recipient')}
                  </th>
                  <th className='px-3 py-2 font-medium'>
                    {t('deliveries.columns.result')}
                  </th>
                  <th className='px-3 py-2 text-right font-medium'>
                    {t('deliveries.columns.attempts')}
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {rows.map((row) => (
                  <tr
                    key={row.delivery.id}
                    aria-current={
                      selectedId === row.delivery.id ? 'true' : undefined
                    }
                    className='aria-[current=true]:bg-muted/60'
                  >
                    <td className='px-3 py-2 whitespace-nowrap'>
                      <Button
                        variant='link'
                        size='sm'
                        className='h-auto p-0'
                        onClick={() => onSelect(row.delivery.id)}
                      >
                        {formatTime(row.delivery.createdAt, language)}
                      </Button>
                    </td>
                    <td className='px-3 py-2'>
                      <p className='font-medium'>
                        {kindName(row.kind) ?? t('deliveries.directSend')}
                      </p>
                      <p className='text-xs break-all text-muted-foreground'>
                        {[row.sourceType, row.sourceReferenceId]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </td>
                    <td className='px-3 py-2 break-all'>
                      {row.delivery.channelName}
                    </td>
                    <td className='px-3 py-2 font-mono text-xs break-all'>
                      {row.delivery.recipientKey ?? '—'}
                    </td>
                    <td className='px-3 py-2'>
                      <StatusBadge status={row.delivery.status} />
                      {row.delivery.status === 'failed' &&
                        row.delivery.lastError && (
                          <p className='mt-1 max-w-xs break-words text-xs text-destructive'>
                            {row.delivery.lastError.message}
                          </p>
                        )}
                    </td>
                    <td className='px-3 py-2 text-right tabular-nums'>
                      {row.delivery.attemptCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {more.key === key && more.error ? (
            <p role='alert' className='text-sm text-destructive'>
              {more.error}
            </p>
          ) : null}
          {last?.meta.nextPageToken ? (
            <div className='flex justify-center'>
              <Button
                variant='outline'
                disabled={more.key === key && more.loading}
                onClick={loadMore}
              >
                {t('deliveries.loadMore')}
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <p
          role='status'
          className='rounded-lg border p-8 text-center text-sm text-muted-foreground'
        >
          {t('deliveries.empty')}
        </p>
      )}
      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) onSelect(null);
        }}
      >
        <SheetContent
          showCloseButton={false}
          className='w-full gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl'
        >
          {selectedId ? (
            <DeliveryDetail
              key={selectedId}
              id={selectedId}
              kindName={kindName}
              onClose={() => onSelect(null)}
              onRetried={reload}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DeliveryDetail({
  id,
  kindName,
  onClose,
  onRetried,
}: {
  readonly id: string;
  readonly kindName: (id: string | undefined) => string | undefined;
  readonly onClose: () => void;
  readonly onRetried: () => void;
}): ReactElement {
  const api = useSettingsApi();
  const { t, language } = useNotificationText();
  const canManage = useCanManageNotifications();
  const [loaded, reload] = useLoaded(() => api.delivery(id), `delivery:${id}`);
  const detail: NotificationDeliveryLogDetails | undefined =
    loaded.state === 'ready' ? loaded.data : undefined;
  const status = detail?.delivery.status;
  return (
    <>
      <SheetHeader className='border-b pr-12'>
        <SheetTitle className='text-lg'>
          {detail
            ? (kindName(detail.kind) ?? t('deliveries.directSend'))
            : t('deliveries.details')}
        </SheetTitle>
        <SheetDescription>
          {detail ? formatTime(detail.delivery.createdAt, language) : null}
        </SheetDescription>
        <Button
          variant='ghost'
          size='icon-sm'
          className='absolute top-3 right-3'
          aria-label={t('common.close')}
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </SheetHeader>
      <div className='flex-1 space-y-6 overflow-y-auto p-4 sm:p-6'>
        {loaded.state !== 'ready' ? (
          <LoadState loaded={loaded} onRetry={reload} />
        ) : detail ? (
          <>
            <div className='flex flex-wrap items-center gap-2 text-sm'>
              <StatusBadge status={detail.delivery.status} />
              <span>{detail.delivery.channelName}</span>
              {detail.delivery.recipientKey && (
                <span className='break-all text-muted-foreground'>
                  {detail.delivery.recipientKey}
                </span>
              )}
            </div>
            <dl className='grid gap-1 text-sm'>
              {detail.delivery.lastError ? (
                <>
                  <dt className='text-muted-foreground'>
                    {t('deliveries.lastError')}
                  </dt>
                  <dd className='break-words text-destructive'>
                    {detail.delivery.lastError.code
                      ? `${detail.delivery.lastError.code}: `
                      : ''}
                    {detail.delivery.lastError.message}
                  </dd>
                </>
              ) : null}
              {detail.delivery.nextRunAt ? (
                <>
                  <dt className='text-muted-foreground'>
                    {t('deliveries.nextRun')}
                  </dt>
                  <dd>{formatTime(detail.delivery.nextRunAt, language)}</dd>
                </>
              ) : null}
            </dl>
            {status === 'unknown' ? (
              <Alert>
                <TriangleAlertIcon />
                <AlertDescription>
                  {t('deliveries.unknownHint')}
                </AlertDescription>
              </Alert>
            ) : null}
            <section aria-labelledby='delivery-attempts' className='space-y-2'>
              <h3 id='delivery-attempts' className='text-sm font-medium'>
                {t('deliveries.attempts')}
              </h3>
              {detail.attempts.length ? (
                <ol className='space-y-2'>
                  {detail.attempts.map((attempt) => (
                    <li
                      key={attempt.id}
                      className='rounded-lg border p-3 text-sm'
                    >
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='font-medium'>
                          {t('deliveries.attempt', {
                            sequence: attempt.sequence,
                          })}
                        </span>
                        <StatusBadge status={attempt.status} />
                        <span className='text-xs text-muted-foreground'>
                          {formatTime(attempt.startedAt, language)}
                        </span>
                      </div>
                      {attempt.error ? (
                        <p className='mt-1 text-xs break-words text-muted-foreground'>
                          {attempt.error.code ? `${attempt.error.code}: ` : ''}
                          {attempt.error.message}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {t('deliveries.noAttempts')}
                </p>
              )}
            </section>
            {detail.retryAudits.length ? (
              <section aria-labelledby='delivery-audits' className='space-y-2'>
                <h3 id='delivery-audits' className='text-sm font-medium'>
                  {t('deliveries.audits')}
                </h3>
                <ul className='space-y-2'>
                  {detail.retryAudits.map((audit) => (
                    <li
                      key={audit.id}
                      className='rounded-lg border p-3 text-sm'
                    >
                      <p className='break-words'>{audit.resolution.reason}</p>
                      <p className='text-xs text-muted-foreground'>
                        {formatTime(audit.resolution.requestedAt, language)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {canManage && status === 'failed' ? (
              <RetryForm
                deliveryId={id}
                channel={detail.delivery.channelName}
                onRetried={() => {
                  reload();
                  onRetried();
                }}
              />
            ) : null}
            <Collapsible>
              <CollapsibleTrigger className='text-sm text-muted-foreground underline'>
                {t('templates.technical')}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <dl className='grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm'>
                  <dt className='text-muted-foreground'>
                    {t('deliveries.source')}
                  </dt>
                  <dd className='break-all'>
                    {[detail.sourceType, detail.sourceReferenceId]
                      .filter(Boolean)
                      .join(' · ')}
                  </dd>
                  {detail.idempotencyKey ? (
                    <>
                      <dt className='text-muted-foreground'>
                        {t('deliveries.idempotencyKey')}
                      </dt>
                      <dd className='font-mono text-xs break-all'>
                        {detail.idempotencyKey}
                      </dd>
                    </>
                  ) : null}
                </dl>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : null}
      </div>
    </>
  );
}

function RetryForm({
  deliveryId,
  channel,
  onRetried,
}: {
  readonly deliveryId: string;
  readonly channel: string;
  readonly onRetried: () => void;
}): ReactElement {
  const api = useSettingsApi();
  const { t } = useNotificationText();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = reason.trim();
  const submit = () => {
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    api.retryDelivery(deliveryId, trimmed).then(
      () => {
        setBusy(false);
        setReason('');
        onRetried();
      },
      (cause: unknown) => {
        setBusy(false);
        setError(
          requestFailure(cause) === 'forbidden'
            ? t('settings.errors.forbidden')
            : failureMessage(cause, t('deliveries.retryFailed')),
        );
      },
    );
  };
  return (
    <section className='space-y-3 rounded-lg border bg-muted/30 p-4'>
      <h3 className='font-medium'>{t('deliveries.retryTitle')}</h3>
      <label className='space-y-1.5 text-sm'>
        <span className='font-medium'>{t('deliveries.reason')}</span>
        <Textarea
          value={reason}
          maxLength={500}
          required
          rows={3}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      {error ? (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      ) : null}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <span className='text-xs text-muted-foreground'>
          {t('deliveries.retryDescription', { channel })}
        </span>
        <Button disabled={!trimmed || busy} onClick={submit}>
          {t('deliveries.retry')}
        </Button>
      </div>
    </section>
  );
}
