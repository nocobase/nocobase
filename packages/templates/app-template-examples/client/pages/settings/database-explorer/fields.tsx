import type {
  CollectionDetail,
  CollectionListResult,
  DatabaseExplorerClient,
} from '@nocobase/app-plugin-database-explorer/client';

type CollectionEntry = CollectionListResult['items'][number];
import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  KeyRound,
  Search,
  X,
} from 'lucide-react';
import { cn } from 'cn';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Badge } from '#components/ui/badge';
import { buttonVariants } from '#components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#components/ui/input-group';
import { Skeleton } from '#components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { Recovery, StatusLine } from './feedback.js';
import {
  fieldMatches,
  fieldRows,
  warningMessages,
  type FieldRow,
} from './model.js';
import { Name } from './name.js';
import { describeFailure, useMediaQuery, useRead } from './read.js';

/** From this width the fields show as a table; below it, as stacked blocks. */
const WIDE_QUERY = '(min-width: 40rem)';

export interface FieldsPanelProps {
  readonly client: DatabaseExplorerClient;
  readonly connection: string;
  readonly dialect: string;
  readonly table: string;
  /** The table's listing entry, once the list has loaded. */
  readonly entry: CollectionEntry | undefined;
  /** Names of the connection's tables, to link references only to tables that exist. */
  readonly knownTables: ReadonlySet<string> | undefined;
  readonly query: string;
  readonly onQuery: (value: string) => void;
  readonly backLink: string;
  readonly tableLink: (name: string) => string;
}

export function FieldsPanel({
  client,
  connection,
  dialect,
  table,
  entry,
  knownTables,
  query,
  onQuery,
  backLink,
  tableLink,
}: FieldsPanelProps): ReactElement {
  const { t } = useTranslation();
  const wide = useMediaQuery(WIDE_QUERY);
  // The panel is keyed by connection and table, so this read belongs to one table for its whole life.
  const detail = useRead<CollectionDetail>(`${connection}\n${table}`, () =>
    client.collection(connection, table),
  );
  const definition =
    detail.status === 'ready' ? detail.data.collection.collection : undefined;
  const rows = definition ? fieldRows(definition) : [];
  const matched = rows.filter((row) => fieldMatches(query, row));
  const failure =
    detail.status === 'error' ? describeFailure(detail.error) : undefined;
  const title = definition?.title ?? entry?.title;
  const kind = definition?.kind ?? entry?.kind;
  const tableName = entry?.tableName;
  // SQLite attachment names and MySQL database names are not a separate schema level.
  const schema = ['sqlite', 'mysql', 'mariadb'].includes(dialect)
    ? undefined
    : entry?.schema;
  const hasMetadata = Boolean(
    title ||
    (tableName && tableName !== table) ||
    schema ||
    (kind && kind !== 'table'),
  );
  const warnings =
    detail.status === 'ready'
      ? warningMessages(detail.data.collection.warnings)
      : [];

  return (
    <section
      aria-labelledby='database-explorer-fields-heading'
      // Clipping only where the panel scrolls inside itself: on a narrow page the
      // back bar and column headings stick to the page, which clipping would stop.
      className='flex min-w-0 flex-col lg:min-h-0 lg:overflow-hidden'
    >
      {/* On a narrow screen the way back to the tables stays in view while the fields scroll. */}
      <div className='sticky top-0 z-20 flex h-11 items-center gap-2 rounded-t-lg border-b bg-card px-2 lg:hidden'>
        <Link
          to={backLink}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'shrink-0',
          )}
        >
          <ArrowLeft aria-hidden='true' />
          {t('databaseExplorer.backToTables')}
        </Link>
        <span
          aria-hidden='true'
          className='min-w-0 truncate text-sm text-muted-foreground'
        >
          {title ?? table}
        </span>
      </div>
      <div className='flex shrink-0 flex-col gap-2 border-b p-4'>
        <h2
          id='database-explorer-fields-heading'
          tabIndex={-1}
          className='font-heading text-base font-semibold wrap-anywhere outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
        >
          <Name value={title ?? table} />
        </h2>
        {hasMetadata ? (
          <dl className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
            {title ? (
              <Meta
                label={t('databaseExplorer.collectionName')}
                value={table}
              />
            ) : null}
            {tableName && tableName !== table ? (
              <Meta label={t('databaseExplorer.tableName')} value={tableName} />
            ) : null}
            {schema ? (
              <Meta label={t('databaseExplorer.schema')} value={schema} />
            ) : null}
            {kind && kind !== 'table' ? (
              <Meta
                label={t('databaseExplorer.kindLabel')}
                value={t(`databaseExplorer.kind.${kind}`, {
                  defaultValue: kind,
                })}
                plain
              />
            ) : null}
          </dl>
        ) : null}
        {definition?.description ? (
          <p className='text-sm text-muted-foreground wrap-anywhere'>
            {definition.description}
          </p>
        ) : null}
      </div>

      {detail.status === 'loading' ? (
        <FieldsPlaceholder />
      ) : failure ? (
        <div className='flex flex-col items-center gap-2 pb-4'>
          <StatusLine notice={failure} />
          <Recovery failure={failure} onRetry={detail.reload} />
        </div>
      ) : !rows.length ? (
        <StatusLine notice='noFields' />
      ) : (
        <>
          <Collapsible className='shrink-0 border-b'>
            <div className='flex flex-wrap items-center gap-3 px-4 py-3'>
              <InputGroup className='w-full sm:max-w-xs'>
                <InputGroupAddon>
                  <Search aria-hidden='true' />
                </InputGroupAddon>
                <InputGroupInput
                  type='search'
                  aria-label={t('databaseExplorer.searchFields')}
                  placeholder={t('databaseExplorer.searchFields')}
                  value={query}
                  onChange={(event) => onQuery(event.target.value)}
                />
                {query ? (
                  <InputGroupAddon align='inline-end'>
                    <InputGroupButton
                      size='icon-xs'
                      aria-label={t('databaseExplorer.clearSearch')}
                      title={t('databaseExplorer.clearSearch')}
                      onClick={() => onQuery('')}
                    >
                      <X />
                    </InputGroupButton>
                  </InputGroupAddon>
                ) : null}
              </InputGroup>
              <p
                role='status'
                aria-live='polite'
                className='text-xs text-muted-foreground sm:ml-auto'
              >
                {query.trim()
                  ? t('databaseExplorer.fieldsMatched', {
                      count: matched.length,
                      total: rows.length,
                    })
                  : t('databaseExplorer.fieldCount', { count: rows.length })}
              </p>
              {warnings.length ? (
                <CollapsibleTrigger className='flex items-center gap-1 rounded-md text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&[data-panel-open]>svg]:rotate-90'>
                  <ChevronRight
                    aria-hidden='true'
                    className='size-3.5 shrink-0 transition-transform'
                  />
                  {t('databaseExplorer.warnings', { count: warnings.length })}
                </CollapsibleTrigger>
              ) : null}
            </div>
            {warnings.length ? (
              <CollapsibleContent>
                <div className='max-h-40 overflow-y-auto border-t bg-muted/30 px-4 py-3 text-xs text-muted-foreground'>
                  <p className='mb-2'>
                    {t('databaseExplorer.warningDescription')}
                  </p>
                  <ul className='list-disc pl-4 wrap-anywhere'>
                    {warnings.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            ) : null}
          </Collapsible>
          <div className='lg:min-h-0 lg:flex-1 lg:overflow-y-auto'>
            {matched.length ? (
              wide ? (
                <FieldTable
                  table={table}
                  rows={matched}
                  knownTables={knownTables}
                  tableLink={tableLink}
                />
              ) : (
                <FieldList
                  table={table}
                  rows={matched}
                  knownTables={knownTables}
                  tableLink={tableLink}
                />
              )
            ) : (
              <StatusLine notice='noResults' />
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Meta({
  label,
  value,
  plain = false,
}: {
  label: string;
  value: string;
  /** Translated text rather than an identifier. */
  plain?: boolean;
}) {
  return (
    <div className='flex min-w-0 gap-1'>
      <dt>{label}</dt>
      <dd
        className={cn('text-foreground wrap-break-word', !plain && 'font-mono')}
      >
        {plain ? value : <Name value={value} />}
      </dd>
    </div>
  );
}

interface FieldCellProps {
  readonly row: FieldRow;
  readonly knownTables: ReadonlySet<string> | undefined;
  readonly tableLink: (name: string) => string;
}

function FieldName({ row }: FieldCellProps): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <span className='min-w-0 font-medium wrap-break-word'>
          <Name value={row.name} />
        </span>
        {row.primaryKey ? (
          <Badge variant='secondary' data-size='sm'>
            <KeyRound aria-hidden='true' />
            {t('databaseExplorer.primaryKey')}
          </Badge>
        ) : null}
      </div>
      {row.title ? (
        <span className='block text-xs text-muted-foreground wrap-anywhere'>
          {row.title}
        </span>
      ) : null}
    </>
  );
}

function FieldType({ row }: FieldCellProps): ReactElement {
  const showNative =
    row.nativeType !== undefined &&
    row.nativeType.toLocaleLowerCase() !== row.type.toLocaleLowerCase();
  return (
    <span className='flex flex-wrap items-baseline gap-x-2 gap-y-1'>
      <code className='font-mono text-xs wrap-anywhere'>{row.type}</code>
      {showNative ? (
        <span className='font-mono text-xs text-muted-foreground wrap-anywhere'>
          {row.nativeType}
        </span>
      ) : null}
    </span>
  );
}

/** Yes or No only when the definition says so; otherwise that it was not reported, never a guess. */
function FieldNullable({ row }: FieldCellProps): ReactElement {
  const { t } = useTranslation();
  if (row.relation)
    return (
      <span
        className='text-muted-foreground'
        title={t('databaseExplorer.relationNullable')}
      >
        {t('databaseExplorer.notApplicable')}
      </span>
    );
  return row.nullable === undefined ? (
    <span className='text-muted-foreground'>
      {t('databaseExplorer.notReported')}
    </span>
  ) : (
    <>{t(`databaseExplorer.${row.nullable ? 'yes' : 'no'}`)}</>
  );
}

function FieldReferences({
  row,
  knownTables,
  tableLink,
}: FieldCellProps): ReactElement {
  const { t } = useTranslation();
  if (!row.references.length)
    return (
      <span className='text-muted-foreground'>
        <span aria-hidden='true'>—</span>
        <span className='sr-only'>{t('databaseExplorer.none')}</span>
      </span>
    );
  return (
    <ul className='flex flex-col gap-1'>
      {row.references.map((reference) => (
        <li
          key={`${reference.relation ?? ''}:${reference.collection}:${reference.fields?.join(',') ?? ''}`}
          className='wrap-break-word'
        >
          {knownTables?.has(reference.collection) ? (
            <Link
              to={tableLink(reference.collection)}
              className='font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            >
              <Name value={reference.collection} />
            </Link>
          ) : (
            <span className='font-medium'>
              <Name value={reference.collection} />
            </span>
          )}
          {reference.fields?.length ? (
            <span className='text-muted-foreground'>
              .{reference.fields.join(', ')}
            </span>
          ) : null}
          {reference.relation ? (
            <span className='ml-2 text-xs text-muted-foreground'>
              {reference.relation}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Rows shaped like the fields that are loading, so switching tables keeps the panel's size instead of collapsing it. */
function FieldsPlaceholder(): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-busy='true'
      className='flex min-h-64 flex-col gap-3 p-4'
    >
      <span className='sr-only'>{t('databaseExplorer.loading')}</span>
      <Skeleton aria-hidden='true' className='h-8 w-full sm:max-w-xs' />
      {['w-2/3', 'w-1/2', 'w-3/5', 'w-2/5', 'w-4/5'].map((width) => (
        <Skeleton key={width} aria-hidden='true' className={cn('h-5', width)} />
      ))}
    </div>
  );
}

function FieldTable({
  table,
  rows,
  ...cell
}: Omit<FieldCellProps, 'row'> & {
  table: string;
  rows: readonly FieldRow[];
}): ReactElement {
  const { t } = useTranslation();
  // A plain table rather than the Table primitive, whose own horizontal scroll
  // container would keep the column headings from sticking to the scrolling panel.
  return (
    <table
      aria-label={t('databaseExplorer.fieldsOf', { table })}
      className='w-full table-fixed caption-bottom text-sm'
    >
      {/* On a narrow page the headings stick below the back bar (h-11); in the panel, to its top. */}
      <TableHeader className='sticky top-11 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)] lg:top-0'>
        <TableRow className='hover:bg-transparent'>
          <TableHead className='w-[32%] pl-4'>
            {t('databaseExplorer.column.field')}
          </TableHead>
          <TableHead className='w-[30%]'>
            {t('databaseExplorer.column.type')}
          </TableHead>
          <TableHead className='w-[14%]'>
            {t('databaseExplorer.column.nullable')}
          </TableHead>
          <TableHead className='pr-4'>
            {t('databaseExplorer.column.references')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell className='max-w-80 pl-4 align-top whitespace-normal'>
              <FieldName row={row} {...cell} />
            </TableCell>
            <TableCell className='align-top whitespace-normal'>
              <FieldType row={row} {...cell} />
            </TableCell>
            <TableCell className='align-top whitespace-normal'>
              <FieldNullable row={row} {...cell} />
            </TableCell>
            <TableCell className='pr-4 align-top whitespace-normal'>
              <FieldReferences row={row} {...cell} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </table>
  );
}

/** A narrow-screen field's nullability as one short tag; relation fields have none to show. */
function NullableTag({ row }: { row: FieldRow }): ReactElement | null {
  const { t } = useTranslation();
  if (row.relation) return null;
  const state =
    row.nullable === undefined ? 'unknown' : row.nullable ? 'yes' : 'no';
  return (
    <span className={cn(state === 'no' && 'text-foreground')}>
      {t(`databaseExplorer.nullableTag.${state}`)}
    </span>
  );
}

/**
 * The narrow-screen form of the table: two lines per field — its name and type,
 * then only what applies to it — so a long table stays scannable without sideways scrolling.
 */
function FieldList({
  table,
  rows,
  ...cell
}: Omit<FieldCellProps, 'row'> & {
  table: string;
  rows: readonly FieldRow[];
}): ReactElement {
  const { t } = useTranslation();
  return (
    <ul
      aria-label={t('databaseExplorer.fieldsOf', { table })}
      className='flex flex-col border-t'
    >
      {rows.map((row) => (
        <li
          key={row.name}
          className='flex flex-col gap-1 border-b px-4 py-2.5 last:border-b-0'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
              <FieldName row={row} {...cell} />
            </div>
            <div className='max-w-[45%] shrink-0 text-right'>
              <span className='sr-only'>
                {t('databaseExplorer.column.type')}
              </span>
              <FieldType row={row} {...cell} />
            </div>
          </div>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground'>
            <NullableTag row={row} />
            {row.references.length ? (
              <div className='flex min-w-0 items-baseline gap-1'>
                <ArrowRight
                  aria-hidden='true'
                  className='size-3 shrink-0 self-center'
                />
                <span className='sr-only'>
                  {t('databaseExplorer.column.references')}
                </span>
                <FieldReferences row={row} {...cell} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
