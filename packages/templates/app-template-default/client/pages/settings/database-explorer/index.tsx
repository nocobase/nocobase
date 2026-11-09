import { useApiClient } from '@nocobase/app-client';
import {
  DatabaseExplorerClient,
  type ConnectionListResult,
} from '@nocobase/app-plugin-database-explorer/client';
import { useTranslation } from '@nocobase/i18n/client';
import { TableProperties } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useSearchParams } from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { LoadingLine, Recovery, StatusLine } from './feedback.js';
import { FieldsPanel } from './fields.js';
import { PARAM, readTables, type TableListing } from './model.js';
import { describeFailure, useRead } from './read.js';
import { TablesPanel } from './tables.js';

/** Below this width the page shows one level at a time: tables, then a table's fields. */
const DESKTOP_QUERY = '(min-width: 64rem)';

function isDesktop(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia(DESKTOP_QUERY).matches
    : true;
}

export default function DatabaseExplorerPage(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const client = useMemo(() => new DatabaseExplorerClient(api), [api]);
  const connections = useRead('connections', () => client.connections());
  const failure =
    connections.status === 'error'
      ? describeFailure(connections.error)
      : undefined;
  return (
    <PageContainer className='flex flex-col gap-4 space-y-0 lg:h-full lg:min-h-0 [&>header]:shrink-0'>
      <PageHeader
        title={t('databaseExplorer.title')}
        description={t('databaseExplorer.description')}
        actions={
          failure ? (
            <Recovery failure={failure} onRetry={connections.reload} />
          ) : undefined
        }
      />
      {connections.status === 'ready' && connections.data.items.length ? (
        <Explorer client={client} connections={connections.data} />
      ) : (
        <section className='rounded-lg border bg-card'>
          {connections.status === 'loading' ? (
            <LoadingLine />
          ) : (
            <StatusLine notice={failure ?? 'noConnections'} />
          )}
        </section>
      )}
    </PageContainer>
  );
}

function Explorer({
  client,
  connections,
}: {
  client: DatabaseExplorerClient;
  connections: ConnectionListResult;
}): ReactElement {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const connection =
    params.get(PARAM.connection) ??
    connections.default ??
    connections.items[0].name;
  const summary = connections.items.find((item) => item.name === connection);
  const table = params.get(PARAM.table);
  const showsFields = Boolean(table && summary);

  const [progress, setProgress] = useState<{ key: string; count: number }>();
  const tables = useRead<TableListing>(summary ? connection : null, () =>
    readTables(client, connection, (count) =>
      setProgress({ key: connection, count }),
    ),
  );

  /** Search parameters for a location in this connection, keeping what still applies. */
  const link = (changes: Record<string, string | null>): string => {
    const next = new URLSearchParams(params);
    next.set(PARAM.connection, connection);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return `?${next.toString()}`;
  };

  // On a narrow screen the list and the fields replace each other, so focus
  // follows the level that is now shown instead of falling to the page.
  const previousTableRef = useRef(table);
  useEffect(() => {
    const previous = previousTableRef.current;
    previousTableRef.current = table;
    if (previous === table || isDesktop()) return;
    if (table) {
      document.getElementById('database-explorer-fields-heading')?.focus();
      return;
    }
    const origin = previous
      ? document.querySelector<HTMLElement>(
          `[data-table="${CSS.escape(previous)}"]`,
        )
      : null;
    (
      origin ?? document.getElementById('database-explorer-table-search')
    )?.focus();
  }, [table]);

  return (
    <div className='grid min-w-0 overflow-hidden rounded-lg border bg-card lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(15rem,19rem)_minmax(0,1fr)]'>
      <TablesPanel
        className={showsFields ? 'hidden lg:flex' : 'flex'}
        connections={connections.items}
        connection={connection}
        summary={summary}
        tables={tables}
        progress={progress?.key === connection ? progress.count : 0}
        selected={table}
        query={params.get(PARAM.tableSearch) ?? ''}
        onQuery={(value) =>
          setParams(link({ [PARAM.tableSearch]: value }), { replace: true })
        }
        onConnection={(name) =>
          setParams(new URLSearchParams({ [PARAM.connection]: name }))
        }
        tableLink={(name) =>
          link({ [PARAM.table]: name, [PARAM.fieldSearch]: null })
        }
      />
      {table && summary ? (
        <FieldsPanel
          key={`${connection}\n${table}`}
          client={client}
          connection={connection}
          dialect={summary.dialect}
          table={table}
          entry={
            tables.status === 'ready'
              ? tables.data.items.find((item) => item.name === table)
              : undefined
          }
          knownTables={
            tables.status === 'ready'
              ? new Set(tables.data.items.map((item) => item.name))
              : undefined
          }
          query={params.get(PARAM.fieldSearch) ?? ''}
          onQuery={(value) =>
            setParams(link({ [PARAM.fieldSearch]: value }), { replace: true })
          }
          backLink={link({ [PARAM.table]: null, [PARAM.fieldSearch]: null })}
          tableLink={(name) =>
            link({ [PARAM.table]: name, [PARAM.fieldSearch]: null })
          }
        />
      ) : (
        <section
          aria-label={t('databaseExplorer.fields')}
          className='hidden min-h-48 items-center justify-center gap-2 p-6 text-sm text-muted-foreground lg:flex'
        >
          <TableProperties aria-hidden='true' className='size-4 shrink-0' />
          <p>{t('databaseExplorer.selectTable')}</p>
        </section>
      )}
    </div>
  );
}
