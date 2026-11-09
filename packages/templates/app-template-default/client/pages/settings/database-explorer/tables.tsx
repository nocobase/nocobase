import type { ConnectionSummary } from '@nocobase/app-plugin-database-explorer/client';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { Search, Table2, X } from 'lucide-react';
import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { Link } from 'react-router';
import { Badge } from '#components/ui/badge';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { LoadingLine, Recovery, StatusLine } from './feedback.js';
import { tableMatches, type TableListing } from './model.js';
import { describeFailure, type ReadState } from './read.js';

export interface TablesPanelProps {
  readonly className?: string;
  readonly connections: readonly ConnectionSummary[];
  readonly connection: string;
  /** Undefined when the URL names a connection that does not exist. */
  readonly summary: ConnectionSummary | undefined;
  readonly tables: ReadState<TableListing> & { readonly reload: () => void };
  /** Tables read so far while a long list loads. */
  readonly progress: number;
  readonly selected: string | null;
  readonly query: string;
  readonly onQuery: (value: string) => void;
  readonly onConnection: (name: string) => void;
  readonly tableLink: (name: string) => string;
}

/** Moves focus between the list's links with the arrow, Home and End keys. */
function moveFocus(list: HTMLElement | null, key: string, from?: Element) {
  const links = Array.from(list?.querySelectorAll<HTMLElement>('a') ?? []);
  if (!links.length) return false;
  const index = from ? links.indexOf(from as HTMLElement) : -1;
  const target =
    key === 'Home'
      ? 0
      : key === 'End'
        ? links.length - 1
        : key === 'ArrowDown'
          ? Math.min(index + 1, links.length - 1)
          : key === 'ArrowUp'
            ? Math.max(index - 1, 0)
            : undefined;
  if (target === undefined) return false;
  links[target].focus();
  return true;
}

export function TablesPanel({
  className,
  connections,
  connection,
  summary,
  tables,
  progress,
  selected,
  query,
  onQuery,
  onConnection,
  tableLink,
}: TablesPanelProps): ReactElement {
  const { t } = useTranslation();
  const listRef = useRef<HTMLUListElement>(null);
  const items = tables.status === 'ready' ? tables.data.items : [];
  const matched = items.filter((item) => tableMatches(query, item));
  const searching = Boolean(query.trim());
  const ready = tables.status === 'ready';

  // Bring the open table into view when the list first shows it, such as after a refresh or a shared link.
  // Only the list scrolls, so the page keeps its own position.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!ready || !list || !item || list.scrollHeight <= list.clientHeight)
      return;
    const top = item.offsetTop;
    if (
      top < list.scrollTop ||
      top + item.offsetHeight > list.scrollTop + list.clientHeight
    )
      list.scrollTop = top - (list.clientHeight - item.offsetHeight) / 2;
  }, [ready, selected]);

  const failure =
    tables.status === 'error' ? describeFailure(tables.error) : undefined;
  const partialFailure =
    ready && tables.data.error !== undefined
      ? describeFailure(tables.data.error)
      : undefined;

  return (
    <section
      aria-label={t('databaseExplorer.tables')}
      className={cn(
        'min-h-0 min-w-0 flex-col overflow-hidden lg:border-r',
        className,
      )}
    >
      <div className='flex shrink-0 flex-col gap-2 border-b p-4'>
        <label htmlFor='database-connection' className='text-sm font-medium'>
          {t('databaseExplorer.connection')}
        </label>
        <Select
          value={summary ? connection : null}
          onValueChange={(value) => {
            if (value && value !== connection) onConnection(value);
          }}
        >
          <SelectTrigger id='database-connection' className='w-full min-w-0'>
            <SelectValue>
              {(value: string | null) =>
                value ? (
                  <span className='truncate'>{value}</span>
                ) : (
                  <span className='text-muted-foreground'>
                    {t('databaseExplorer.chooseConnection')}
                  </span>
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {connections.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                <span className='flex min-w-0 items-center gap-2'>
                  <span className='truncate'>{item.name}</span>
                  <span className='shrink-0 text-xs text-muted-foreground'>
                    {item.dialect}
                  </span>
                  {item.isDefault ? (
                    <Badge variant='secondary' data-size='sm'>
                      {t('databaseExplorer.defaultConnection')}
                    </Badge>
                  ) : null}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {summary ? (
          <p className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground'>
            <span className='wrap-anywhere'>
              {[
                summary.dialect,
                summary.databaseName,
                summary.schemaManagement &&
                  t(
                    `databaseExplorer.schemaManagement.${summary.schemaManagement}`,
                  ),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            {summary.isDefault ? (
              <Badge variant='secondary' data-size='sm'>
                {t('databaseExplorer.defaultConnection')}
              </Badge>
            ) : null}
          </p>
        ) : null}
      </div>

      {!summary ? (
        <StatusLine notice='connectionNotFound' />
      ) : (
        <>
          <div className='flex shrink-0 flex-col gap-2 p-3'>
            <InputGroup>
              <InputGroupAddon>
                <Search aria-hidden='true' />
              </InputGroupAddon>
              <InputGroupInput
                id='database-explorer-table-search'
                type='search'
                aria-label={t('databaseExplorer.searchTables')}
                placeholder={t('databaseExplorer.searchTables')}
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown') return;
                  const current = listRef.current?.querySelector<HTMLElement>(
                    '[aria-current="true"]',
                  );
                  if (current) current.focus();
                  else moveFocus(listRef.current, 'Home');
                  event.preventDefault();
                }}
              />
              {query ? (
                <InputGroupAddon align='inline-end'>
                  <InputGroupButton
                    size='icon-xs'
                    aria-label={t('databaseExplorer.clearSearch')}
                    title={t('databaseExplorer.clearSearch')}
                    onClick={() => {
                      onQuery('');
                      document
                        .getElementById('database-explorer-table-search')
                        ?.focus();
                    }}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              ) : null}
            </InputGroup>
            {ready ? (
              <p
                role='status'
                className='text-xs text-muted-foreground'
                aria-live='polite'
              >
                {searching
                  ? t('databaseExplorer.tablesMatched', {
                      count: matched.length,
                      total: items.length,
                    })
                  : t('databaseExplorer.tableCount', { count: items.length })}
              </p>
            ) : null}
            {ready && tables.data.truncated ? (
              <p className='text-xs text-muted-foreground'>
                {t('databaseExplorer.truncated', { count: items.length })}
              </p>
            ) : null}
            {partialFailure ? (
              <div
                role='alert'
                className='flex flex-col items-start gap-2 rounded-md border border-dashed p-3 text-xs'
              >
                <p>{t('databaseExplorer.partial', { count: items.length })}</p>
                <Recovery failure={partialFailure} onRetry={tables.reload} />
              </div>
            ) : null}
            {ready &&
            searching &&
            selected &&
            items.some((item) => item.name === selected) &&
            !matched.some((item) => item.name === selected) ? (
              <p className='text-xs text-muted-foreground wrap-anywhere'>
                {t('databaseExplorer.selectedHidden', { table: selected })}
              </p>
            ) : null}
          </div>

          {tables.status === 'loading' ? (
            <LoadingLine
              identity={connection}
              label={
                progress
                  ? t('databaseExplorer.loadingTables', { count: progress })
                  : undefined
              }
            />
          ) : failure ? (
            <div className='flex flex-col items-center gap-2 pb-4'>
              <StatusLine notice={failure} />
              <Recovery failure={failure} onRetry={tables.reload} />
            </div>
          ) : !items.length ? (
            <StatusLine notice='noTables' />
          ) : !matched.length ? (
            <StatusLine notice='noResults' />
          ) : (
            <ul
              ref={listRef}
              aria-label={t('databaseExplorer.tablesIn', { connection })}
              className='relative flex min-h-0 flex-1 flex-col gap-0.5 p-2 pt-0 lg:overflow-y-auto'
              onKeyDown={(event: KeyboardEvent<HTMLUListElement>) => {
                if (
                  moveFocus(listRef.current, event.key, document.activeElement!)
                )
                  event.preventDefault();
              }}
            >
              {matched.map((item, index) => {
                const current = item.name === selected;
                // The list is one Tab stop: the open table, or the first when it is not listed; arrows move within.
                const tabStop =
                  selected && matched.some((entry) => entry.name === selected)
                    ? current
                    : index === 0;
                const primary = item.title ?? item.name;
                const secondary = [
                  item.title ? item.name : undefined,
                  item.tableName !== item.name ? item.tableName : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={item.name}>
                    <Link
                      to={tableLink(item.name)}
                      data-table={item.name}
                      aria-current={current ? 'true' : undefined}
                      tabIndex={tabStop ? 0 : -1}
                      title={[primary, secondary].filter(Boolean).join('\n')}
                      className={cn(
                        'flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                        current &&
                          'bg-accent text-accent-foreground hover:bg-accent',
                      )}
                    >
                      <Table2
                        aria-hidden='true'
                        className='size-4 shrink-0 opacity-60'
                      />
                      <span className='flex min-w-0 flex-1 items-center gap-2'>
                        <span
                          className={cn(
                            'truncate',
                            current ? 'font-medium' : 'font-normal',
                          )}
                        >
                          {primary}
                        </span>
                        {item.kind !== 'table' ? (
                          <Badge variant='outline' className='shrink-0'>
                            {t(`databaseExplorer.kind.${item.kind}`, {
                              defaultValue: item.kind,
                            })}
                          </Badge>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
