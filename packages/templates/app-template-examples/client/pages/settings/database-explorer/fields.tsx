import type {
  CollectionDetail,
  CollectionListResult,
  DatabaseExplorerClient,
} from '@nocobase/app-plugin-database-explorer/client';

type CollectionEntry = CollectionListResult['items'][number];
import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowLeft,
  ChevronRight,
  Database,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { LoadingLine, Recovery, StatusLine } from './feedback.js';
import {
  fieldMatches,
  fieldRows,
  warningMessages,
  type FieldRow,
} from './model.js';
import { describeFailure, useMediaQuery, useRead } from './read.js';

/** From this width the fields show as a table; below it, as stacked blocks. */
const WIDE_QUERY = '(min-width: 40rem)';

export interface FieldsPanelProps {
  readonly client: DatabaseExplorerClient;
  readonly connection: string;
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
  const schema = entry?.schema;
  const warnings =
    detail.status === 'ready'
      ? warningMessages(detail.data.collection.warnings)
      : [];

  return (
    <section
      aria-labelledby='database-explorer-fields-heading'
      className='flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card'
    >
      <div className='flex flex-col gap-2 border-b p-4'>
        <Link
          to={backLink}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2 self-start lg:hidden',
          )}
        >
          <ArrowLeft aria-hidden='true' />
          {t('databaseExplorer.backToTables')}
        </Link>
        <p className='flex min-w-0 items-center gap-1 text-xs text-muted-foreground'>
          <Database aria-hidden='true' className='size-3.5 shrink-0' />
          <span className='truncate'>{connection}</span>
        </p>
        <h2
          id='database-explorer-fields-heading'
          tabIndex={-1}
          className='font-heading text-base font-semibold wrap-anywhere outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
        >
          {title ?? table}
        </h2>
        <dl className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
          {title ? (
            <Meta label={t('databaseExplorer.collectionName')} value={table} />
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
        {definition?.description ? (
          <p className='text-sm text-muted-foreground wrap-anywhere'>
            {definition.description}
          </p>
        ) : null}
      </div>

      {detail.status === 'loading' ? (
        <LoadingLine identity={`${connection}\n${table}`} />
      ) : failure ? (
        <div className='flex flex-col items-center gap-2 pb-4'>
          <StatusLine notice={failure} />
          <Recovery failure={failure} onRetry={detail.reload} />
        </div>
      ) : !rows.length ? (
        <StatusLine notice='noFields' />
      ) : (
        <>
          <div className='flex flex-col gap-2 p-4 pb-2 sm:flex-row sm:items-center sm:justify-between'>
            <InputGroup className='sm:max-w-xs'>
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
              className='text-xs text-muted-foreground'
            >
              {query.trim()
                ? t('databaseExplorer.fieldsMatched', {
                    count: matched.length,
                    total: rows.length,
                  })
                : t('databaseExplorer.fieldCount', { count: rows.length })}
            </p>
          </div>
          {warnings.length ? (
            <Collapsible className='mx-4 mb-2 rounded-md border border-dashed text-xs text-muted-foreground'>
              <CollapsibleTrigger className='flex w-full items-center gap-1 rounded-md px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&[data-panel-open]>svg]:rotate-90'>
                <ChevronRight
                  aria-hidden='true'
                  className='size-3.5 shrink-0 transition-transform'
                />
                {t('databaseExplorer.warnings', { count: warnings.length })}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className='list-disc px-3 pb-2 pl-8 wrap-anywhere'>
                  {warnings.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
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
        className={cn('text-foreground wrap-anywhere', !plain && 'font-mono')}
      >
        {value}
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
        <span className='font-medium wrap-anywhere'>{row.name}</span>
        {row.primaryKey ? (
          <Badge variant='secondary'>
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
    <>
      <code className='font-mono text-xs'>{row.type}</code>
      {showNative ? (
        <span className='block font-mono text-xs text-muted-foreground wrap-anywhere'>
          {row.nativeType}
        </span>
      ) : null}
    </>
  );
}

/** Yes or No only when the definition says so; otherwise that it was not reported, never a guess. */
function FieldNullable({ row }: FieldCellProps): ReactElement {
  const { t } = useTranslation();
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
          className='wrap-anywhere'
        >
          {knownTables?.has(reference.collection) ? (
            <Link
              to={tableLink(reference.collection)}
              className='font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            >
              {reference.collection}
            </Link>
          ) : (
            <span className='font-medium'>{reference.collection}</span>
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

function FieldTable({
  table,
  rows,
  ...cell
}: Omit<FieldCellProps, 'row'> & {
  table: string;
  rows: readonly FieldRow[];
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Table aria-label={t('databaseExplorer.fieldsOf', { table })}>
      <TableHeader>
        <TableRow>
          <TableHead className='pl-4'>
            {t('databaseExplorer.column.field')}
          </TableHead>
          <TableHead>{t('databaseExplorer.column.type')}</TableHead>
          <TableHead>{t('databaseExplorer.column.nullable')}</TableHead>
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
            <TableCell className='align-top'>
              <FieldNullable row={row} {...cell} />
            </TableCell>
            <TableCell className='pr-4 align-top whitespace-normal'>
              <FieldReferences row={row} {...cell} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** The narrow-screen form of the table: one block per field, each value under its label, so nothing scrolls sideways. */
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
          className='flex flex-col gap-2 border-b px-4 py-3 last:border-b-0'
        >
          <div>
            <FieldName row={row} {...cell} />
          </div>
          <dl className='grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm'>
            <dt className='text-muted-foreground'>
              {t('databaseExplorer.column.type')}
            </dt>
            <dd>
              <FieldType row={row} {...cell} />
            </dd>
            <dt className='text-muted-foreground'>
              {t('databaseExplorer.column.nullable')}
            </dt>
            <dd>
              <FieldNullable row={row} {...cell} />
            </dd>
            <dt className='text-muted-foreground'>
              {t('databaseExplorer.column.references')}
            </dt>
            <dd>
              <FieldReferences row={row} {...cell} />
            </dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
