import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { DatabaseExplorerClient } from '@nocobase/app-plugin-database-explorer/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';

/** A keyed read boundary prevents a late response from replacing a newer selection. */
function Read<T>({
  load,
  children,
}: {
  load: () => Promise<T>;
  children: (data: T) => ReactNode;
}) {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ data: T } | { error: unknown }>();
  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setResult({ data });
      },
      (error: unknown) => {
        if (active) setResult({ error });
      },
    );
    return () => {
      active = false;
    };
  }, [load, attempt]);
  if (!result)
    return (
      <p role='status' className='p-4 text-sm text-muted-foreground'>
        {t('databaseExplorer.loading')}
      </p>
    );
  if ('error' in result) {
    const status =
      result.error instanceof ApiClientError ? result.error.status : undefined;
    const key =
      status === 401 ? 'expired' : status === 403 ? 'forbidden' : 'failed';
    return (
      <div role='alert' className='space-y-3 p-4'>
        <p>{t(`databaseExplorer.${key}`)}</p>
        {status === 401 ? (
          <Link to='/login'>{t('databaseExplorer.signIn')}</Link>
        ) : status !== 403 ? (
          <Button
            variant='outline'
            onClick={() => {
              setResult(undefined);
              setAttempt((value) => value + 1);
            }}
          >
            {t('databaseExplorer.retry')}
          </Button>
        ) : null}
      </div>
    );
  }
  return children(result.data);
}

export default function DatabaseExplorerPage() {
  const { t } = useTranslation();
  const api = useApiClient();
  const client = useMemo(() => new DatabaseExplorerClient(api), [api]);
  const load = useCallback(() => client.connections(), [client]);
  const [params, setParams] = useSearchParams();
  return (
    <PageContainer className='space-y-6'>
      <PageHeader
        title={t('databaseExplorer.title')}
        description={t('databaseExplorer.description')}
      />
      <Read load={load}>
        {({ items, default: defaultConnection }) => {
          if (!items.length)
            return <p>{t('databaseExplorer.emptyConnections')}</p>;
          const connection =
            params.get('connection') ?? defaultConnection ?? items[0].name;
          return (
            <div className='space-y-6'>
              <div className='max-w-sm space-y-2'>
                <label
                  htmlFor='database-connection'
                  className='text-sm font-medium'
                >
                  {t('databaseExplorer.connections')}
                </label>
                <Select
                  value={connection}
                  onValueChange={(value) => {
                    if (value) setParams({ connection: value });
                  }}
                >
                  <SelectTrigger id='database-connection' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.name} · {item.dialect}
                        {item.isDefault
                          ? ` · ${t('databaseExplorer.defaultConnection')}`
                          : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ConnectionTables
                key={connection}
                client={client}
                connection={connection}
              />
            </div>
          );
        }}
      </Read>
    </PageContainer>
  );
}

function ConnectionTables({
  client,
  connection,
}: {
  client: DatabaseExplorerClient;
  connection: string;
}) {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const selected = params.get('table');
  const query = params.get('q') ?? '';
  const load = useCallback(
    () => client.allCollections(connection),
    [client, connection],
  );
  return (
    <div className='grid min-w-0 gap-6 lg:grid-cols-[minmax(14rem,1fr)_minmax(0,3fr)]'>
      <section
        aria-label={t('databaseExplorer.tables')}
        className='min-w-0 space-y-3'
      >
        <h2 className='font-heading text-base font-semibold'>
          {t('databaseExplorer.tables')}
        </h2>
        <Input
          aria-label={t('databaseExplorer.searchTables')}
          placeholder={t('databaseExplorer.searchTables')}
          value={query}
          onChange={(event) => {
            setParams(
              (previous) => {
                const next = new URLSearchParams(previous);
                next.set('q', event.target.value);
                return next;
              },
              { replace: true },
            );
          }}
        />
        <Read load={load}>
          {({ items, truncated }) => {
            const matches = items.filter((item) =>
              `${item.name} ${item.tableName} ${item.title ?? ''}`
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()),
            );
            return (
              <>
                {truncated ? (
                  <p role='status' className='text-sm text-muted-foreground'>
                    {t('databaseExplorer.truncated')}
                  </p>
                ) : null}
                {matches.length ? (
                  <ul className='max-h-96 space-y-1 overflow-auto rounded-lg border p-2'>
                    {matches.map((item) => (
                      <li key={item.name}>
                        <Button
                          variant={
                            selected === item.name ? 'secondary' : 'ghost'
                          }
                          className='h-auto w-full justify-start whitespace-normal break-all text-left'
                          aria-pressed={selected === item.name}
                          onClick={() => {
                            setParams((previous) => {
                              const next = new URLSearchParams(previous);
                              next.set('connection', connection);
                              next.set('table', item.name);
                              return next;
                            });
                          }}
                        >
                          {item.title
                            ? `${item.title} (${item.name})`
                            : item.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-muted-foreground'>
                    {t('databaseExplorer.emptyTables')}
                  </p>
                )}
              </>
            );
          }}
        </Read>
      </section>
      <section
        aria-label={t('databaseExplorer.fields')}
        className='min-w-0 space-y-3'
      >
        {selected ? (
          <CollectionFields
            key={selected}
            client={client}
            connection={connection}
            collection={selected}
          />
        ) : (
          <p className='rounded-lg border border-dashed p-6 text-sm text-muted-foreground'>
            {t('databaseExplorer.selectTable')}
          </p>
        )}
      </section>
    </div>
  );
}

function CollectionFields({
  client,
  connection,
  collection,
}: {
  client: DatabaseExplorerClient;
  connection: string;
  collection: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const load = useCallback(
    () => client.collection(connection, collection),
    [client, connection, collection],
  );
  return (
    <>
      <h2 className='break-all font-heading text-base font-semibold'>
        {collection}
      </h2>
      <Input
        aria-label={t('databaseExplorer.searchFields')}
        placeholder={t('databaseExplorer.searchFields')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Read load={load}>
        {({ collection: artifact }) => {
          const fields = (artifact.collection.fields ?? []).filter((field) =>
            `${field.name} ${field.title ?? ''}`
              .toLocaleLowerCase()
              .includes(query.toLocaleLowerCase()),
          );
          return (
            <>
              {artifact.warnings.length ? (
                <p role='status' className='text-sm text-muted-foreground'>
                  {t('databaseExplorer.warnings')}
                </p>
              ) : null}
              {fields.length ? (
                <div className='overflow-hidden rounded-lg border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {[
                          'name',
                          'type',
                          'nullable',
                          'primaryKey',
                          'target',
                        ].map((key) => (
                          <TableHead key={key}>
                            {t(`databaseExplorer.${key}`)}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field) => (
                        <TableRow key={field.name}>
                          <TableCell className='font-medium'>
                            {field.name}
                            {field.title ? (
                              <span className='block text-muted-foreground'>
                                {field.title}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>{field.type}</TableCell>
                          <TableCell>
                            {t(
                              `databaseExplorer.${field.nullable === undefined ? 'unknown' : field.nullable ? 'yes' : 'no'}`,
                            )}
                          </TableCell>
                          <TableCell>
                            {t(
                              `databaseExplorer.${field.primaryKey ? 'yes' : 'no'}`,
                            )}
                          </TableCell>
                          <TableCell>{field.target ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {t('databaseExplorer.emptyFields')}
                </p>
              )}
            </>
          );
        }}
      </Read>
    </>
  );
}
