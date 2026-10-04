import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { DateTimePicker } from '../../components/date-time-picker.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';

const LOG_LEVEL_LABELS = new Map<string, string>([
  ['10', 'TRACE'],
  ['20', 'DEBUG'],
  ['30', 'INFO'],
  ['40', 'WARN'],
  ['50', 'ERROR'],
  ['60', 'FATAL'],
]);

function logLevelLabel(level: string | number): string {
  const value = String(level);
  return LOG_LEVEL_LABELS.get(value) ?? value.toUpperCase();
}

interface Entry {
  time: string;
  level: string | number;
  msg: string;
  logger?: string;
  phase?: string;
  err?: unknown;
  [key: string]: unknown;
}
interface Page {
  entries: Entry[];
  /** The `nextPageToken` to read on from; a log keeps one while it grows. */
  cursor: string;
  hasMore: boolean;
  available: boolean;
  enabled: boolean;
  reset: boolean;
  status?: string;
  phase?: string;
}
/** A log read as the server answers it: the entries in `data`, the token and the journal's state in `meta`. */
interface LogResponse {
  readonly data: Entry[];
  readonly meta: Omit<Page, 'entries' | 'cursor'> & {
    readonly nextPageToken: string;
  };
}
function readPage(response: LogResponse): Page {
  const { nextPageToken, ...meta } = response.meta;
  return { ...meta, entries: response.data, cursor: nextPageToken };
}
export function LogViewer({
  appId,
  deploymentId,
}: {
  readonly appId: string;
  readonly deploymentId?: string;
}): ReactElement {
  const client = useApiClient();
  const { t } = useTranslation('@nocobase/app-plugin-hub');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [page, setPage] = useState<Page>();
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');
  const [source, setSource] = useState('');
  const [since, setSince] = useState<Date>();
  const [until, setUntil] = useState<Date>();
  const [history, setHistory] = useState(false);
  const [nextPage, setNextPage] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endpoint = `hub/apps/${encodeURIComponent(appId)}/${deploymentId ? `deployments/${encodeURIComponent(deploymentId)}/` : ''}logs`;
  const query = useMemo(
    () => ({
      // Unset filters are left out: the Hub validates `level` as one of the levels and rejects an empty one.
      ...(search ? { q: search } : {}),
      ...(level ? { level } : {}),
      ...(source ? { source } : {}),
      ...(since ? { since: since.toISOString() } : {}),
      ...(until ? { until: until.toISOString() } : {}),
    }),
    [search, level, source, since, until],
  );
  const cursorRef = useRef<string | undefined>(undefined);
  const queryRef = useRef('');
  const followingRef = useRef(following);
  useEffect(() => {
    followingRef.current = following;
  }, [following]);
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const identity = JSON.stringify([endpoint, query, history]);
    let fresh = queryRef.current !== identity;
    if (fresh) {
      cursorRef.current = undefined;
      queryRef.current = identity;
    }
    if (!fresh && !following && !history) return;
    let cursor = cursorRef.current;
    const load = async (): Promise<void> => {
      try {
        const result = readPage(
          await client.request<LogResponse>({
            path: endpoint,
            query: {
              ...query,
              pageToken: cursor,
              fromStart:
                Boolean(deploymentId) ||
                history ||
                Object.values(query).some(Boolean),
            },
          }),
        );
        if (cancelled) return;
        cursor = result.cursor;
        cursorRef.current = cursor;
        setPage(result);
        const replace = fresh || result.reset;
        fresh = false;
        setEntries((previous) => {
          const unique = new Map(
            [...(replace ? [] : previous), ...result.entries].map((entry) => [
              typeof entry.logId === 'string'
                ? entry.logId
                : JSON.stringify(entry),
              entry,
            ]),
          );
          return [...unique.values()]
            .sort(
              (a, b) =>
                a.time.localeCompare(b.time) ||
                String(a.logId).localeCompare(String(b.logId)),
            )
            .slice(-2000);
        });
        setError('');
        if (
          (history && result.hasMore && !result.entries.length) ||
          (followingRef.current &&
            ((!history && result.hasMore) ||
              !result.status ||
              ['queued', 'deploying'].includes(result.status)))
        )
          timer = setTimeout(
            () => {
              void load();
            },
            result.hasMore ? 250 : 1500,
          );
      } catch (reason) {
        if (!cancelled)
          setError(reason instanceof Error ? reason.message : String(reason));
      }
    };
    timer = setTimeout(() => {
      void load();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [client, endpoint, query, following, history, nextPage, deploymentId]);
  useEffect(() => {
    if (following && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries, following]);
  const text = entries.map((entry) => JSON.stringify(entry)).join('\n');
  const download = async (): Promise<void> => {
    setDownloading(true);
    try {
      let cursor: string | undefined;
      let bytes = 0;
      const chunks: string[] = [];
      let more = true;
      let scans = 0;
      const exportQuery = {
        ...query,
        until: query.until ?? new Date().toISOString(),
      };
      while (more) {
        if (++scans > 4096) throw new Error(t('logs.downloadLimit'));
        const result = readPage(
          await client.request<LogResponse>({
            path: endpoint,
            query: { ...exportQuery, pageToken: cursor, fromStart: true },
          }),
        );
        if (result.reset) throw new Error(t('logs.downloadChanged'));
        const chunk =
          result.entries.map((entry) => JSON.stringify(entry)).join('\n') +
          '\n';
        bytes += new Blob([chunk]).size;
        if (bytes > 50 * 1024 * 1024) throw new Error(t('logs.downloadLimit'));
        chunks.push(chunk);
        cursor = result.cursor;
        more = result.hasMore;
      }
      const url = URL.createObjectURL(
        new Blob(chunks, { type: 'text/plain;charset=utf-8' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `${deploymentId ?? appId}.log`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setDownloading(false);
    }
  };
  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <Input
          className='w-full sm:w-48'
          placeholder={t('logs.search')}
          aria-label={t('logs.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          items={[
            { value: 'all', label: t('logs.allLevels') },
            ...['trace', 'debug', 'info', 'warn', 'error', 'fatal'].map(
              (name) => ({ value: name, label: name }),
            ),
          ]}
          value={level || 'all'}
          onValueChange={(value) =>
            setLevel(value === 'all' ? '' : (value ?? ''))
          }
        >
          <SelectTrigger
            aria-label={t('logs.level')}
            className='min-w-32 data-[size=default]:h-9'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align='start' alignItemWithTrigger={false}>
            <SelectItem value='all'>{t('logs.allLevels')}</SelectItem>
            {['trace', 'debug', 'info', 'warn', 'error', 'fatal'].map(
              (name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        {!deploymentId && (
          <Input
            className='min-w-0 flex-1 sm:w-40 sm:flex-none'
            placeholder={t('logs.source')}
            aria-label={t('logs.source')}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
        )}
        <DateTimePicker
          className='w-full sm:w-60'
          label={t('logs.since')}
          value={since}
          onChange={setSince}
        />
        <DateTimePicker
          className='w-full sm:w-60'
          label={t('logs.until')}
          value={until}
          onChange={setUntil}
        />
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          variant='outline'
          onClick={() => {
            if (!following) setHistory(false);
            setFollowing(!following);
          }}
        >
          {t(following ? 'logs.pause' : 'logs.follow')}
        </Button>
        <Button
          variant='outline'
          onClick={() => {
            setFollowing(false);
            setHistory(true);
            setNextPage((value) => value + 1);
            cursorRef.current = undefined;
            queryRef.current = '';
          }}
        >
          {t('logs.history')}
        </Button>
        {history && page?.hasMore && (
          <Button
            variant='outline'
            onClick={() => setNextPage((value) => value + 1)}
          >
            {t('logs.next')}
          </Button>
        )}
        <Button
          variant='outline'
          onClick={() => {
            void navigator.clipboard
              .writeText(text)
              .catch((reason: unknown) => setError(String(reason)));
          }}
        >
          {t('logs.copy')}
        </Button>
        <Button
          variant='outline'
          disabled={downloading}
          onClick={() => {
            void download();
          }}
        >
          {t('logs.download')}
        </Button>
        {page?.status && (
          <span className='text-sm text-muted-foreground'>
            {page.status} · {page.phase}
          </span>
        )}
      </div>
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
      {page?.reset && (
        <p className='text-sm text-muted-foreground'>{t('logs.rotated')}</p>
      )}
      <div
        ref={scrollRef}
        onWheel={(event) => {
          if (event.deltaY < 0) setFollowing(false);
        }}
        className='h-[28rem] overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs'
        aria-label={t('logs.title')}
      >
        {!entries.length && (
          <p className='text-muted-foreground'>
            {t(
              !page
                ? 'logs.loading'
                : !page.enabled
                  ? 'logs.disabled'
                  : !page.available
                    ? 'logs.unavailable'
                    : 'logs.empty',
            )}
          </p>
        )}
        {entries.map((entry) => (
          <details
            key={
              typeof entry.logId === 'string'
                ? entry.logId
                : JSON.stringify(entry)
            }
            className='border-b border-border/50 py-1.5'
          >
            <summary
              className={`cursor-pointer whitespace-pre-wrap break-words ${['ERROR', 'FATAL'].includes(logLevelLabel(entry.level)) ? 'text-destructive' : ''}`}
            >
              {entry.time} [{logLevelLabel(entry.level)}]{' '}
              {entry.logger ?? entry.phase} {entry.msg}
            </summary>
            <pre className='mt-2 whitespace-pre-wrap break-words text-muted-foreground'>
              {entry.err &&
              typeof entry.err === 'object' &&
              'stack' in entry.err &&
              typeof entry.err.stack === 'string'
                ? `${entry.err.stack}\n\n${JSON.stringify(entry, null, 2)}`
                : JSON.stringify(entry, null, 2)}
            </pre>
          </details>
        ))}
      </div>
      <p className='text-xs text-muted-foreground'>{t('logs.window')}</p>
    </div>
  );
}
