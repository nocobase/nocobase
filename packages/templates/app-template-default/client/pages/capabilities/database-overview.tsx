import { ApiClientError, useApiClient } from '@nocobase/app-client';
import {
  DatabaseExplorerClient,
  type ConnectionListResult,
  type ConnectionSummary,
} from '@nocobase/app-plugin-database-explorer/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Database, ArrowRight, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, buttonVariants } from '#components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import DatabaseConnectionPrompt from './database-connection-prompt.js';
import { useRouteAccess, useRouteTree } from '../../routing/route-context.js';
import packageMetadata from '../../../package.json' with { type: 'json' };
import {
  CurrentApplication,
  ConfigurationItem,
  ConfigurationActions,
  ConfigurationAction,
  findCapabilityPage,
} from './detail-layout.js';

export default function DatabaseOverview() {
  const { t } = useTranslation(packageMetadata.name);
  const api = useApiClient();
  const routes = useRouteTree();
  const access = useRouteAccess();
  const explorer = findCapabilityPage(routes, access.denied, [
    'databaseExplorer',
  ]);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    { data: ConnectionListResult } | { error: unknown }
  >();
  useEffect(() => {
    let active = true;
    new DatabaseExplorerClient(api).connections().then(
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
  }, [api, attempt]);
  const errorStatus =
    result && 'error' in result && result.error instanceof ApiClientError
      ? result.error.status
      : undefined;
  const connections =
    result && 'data' in result ? result.data.items : undefined;
  const stepNames = [
    'prepare',
    'driver',
    'configure',
    'management',
    'environment',
    'validate',
    'restart',
  ];
  const defaultConnection =
    result && 'data' in result ? result.data.default : null;
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication
        footer={
          result && 'error' in result ? (
            <>
              <p role='alert'>
                {t(
                  `databaseExplorer.${errorStatus === 401 ? 'expired' : errorStatus === 403 ? 'forbidden' : 'failed'}`,
                )}
              </p>
              {errorStatus === 401 ? (
                <Link to='/login'>{t('databaseExplorer.signIn')}</Link>
              ) : errorStatus !== 403 ? (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setResult(undefined);
                    setAttempt((value) => value + 1);
                  }}
                >
                  {t('databaseExplorer.retry')}
                </Button>
              ) : null}
            </>
          ) : (
            <p>{t('databaseOverview.runtimeNote')}</p>
          )
        }
      >
        {connections ? (
          <div className='flex flex-wrap items-center justify-between gap-2 py-4 text-sm'>
            <p className='font-medium'>
              {t('databaseOverview.connectionCount', {
                count: connections.length,
              })}
            </p>
            {defaultConnection ? (
              <p className='text-muted-foreground'>
                {t('databaseOverview.currentDefault', {
                  name: defaultConnection,
                })}
              </p>
            ) : null}
          </div>
        ) : null}
        {connections?.length ? (
          connections.map((connection) => (
            <ConfigurationItem
              key={connection.name}
              title={connection.name}
              state={true}
              icon={Database}
              description={[
                connection.dialect,
                t(
                  `databaseOverview.${connection.schemaManagement === 'external' ? 'external' : 'managed'}`,
                ),
                connection.isDefault
                  ? t('databaseExplorer.defaultConnection')
                  : undefined,
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              {explorer && !explorer.denied && !access.loading ? (
                <Link
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  to={`${explorer.route.path}?${new URLSearchParams({ connection: connection.name })}`}
                >
                  {t('databaseOverview.browse')}
                  <ArrowRight aria-hidden />
                </Link>
              ) : (
                <p className='text-xs leading-5 text-muted-foreground'>
                  {t(
                    access.loading
                      ? 'featureOverview.apiKeys.checkingAccess'
                      : explorer?.denied
                        ? 'databaseOverview.explorerDenied'
                        : 'databaseOverview.explorerMissing',
                  )}
                </p>
              )}
              <ConnectionConfiguration connection={connection} />
            </ConfigurationItem>
          ))
        ) : (
          <ConfigurationItem
            title={t('databaseOverview.options.connections.title')}
            description={t('featureOverview.layout.databaseDescription')}
            state={!result ? 'loading' : connections ? false : undefined}
            icon={Database}
          />
        )}
      </CurrentApplication>
      <ConfigurationActions>
        <ConfigurationAction
          title={t('databaseOverview.addConnection.title')}
          description={t('featureOverview.layout.databaseAddDescription')}
          prompt={<DatabaseConnectionPrompt />}
          steps={stepNames.map((key) =>
            t(`databaseOverview.addConnection.${key}`),
          )}
          configuration={
            <div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
              <p className='text-sm font-medium'>
                {t('databaseOverview.configurationGuide')}
              </p>
              <p className='text-sm leading-6 text-muted-foreground'>
                {t('databaseOverview.addConnection.exampleHint')}
              </p>
              <pre className='overflow-x-auto rounded-md bg-muted p-3 text-xs leading-6'>
                <code>{POSTGRES_CONNECTION_EXAMPLE}</code>
              </pre>
            </div>
          }
        />
        {(['default', 'management', 'transport', 'naming'] as const).map(
          (action) => (
            <ConfigurationAction
              key={action}
              title={t(`databaseOverview.actions.${action}.title`)}
              description={t(`databaseOverview.options.${action}.description`)}
              prompt={t(`databaseOverview.actions.${action}.prompt`)}
              steps={['inspect', 'configure', 'verify'].map((step) =>
                t(`databaseOverview.actions.${action}.${step}`),
              )}
            />
          ),
        )}
      </ConfigurationActions>
    </div>
  );
}

const POSTGRES_CONNECTION_EXAMPLE = `database:
  connections:
    analytics:
      dialect: postgres
      host: <database-host>
      port: 5432
      database: <database-name>
      username: <database-user>
      password: <database-password>
      schemaManagement: external`;

function ConnectionConfiguration({
  connection,
}: {
  connection: ConnectionSummary;
}) {
  const { t } = useTranslation(packageMetadata.name);
  const values: readonly (readonly [string, string | undefined])[] = [
    ['type', connection.dialect],
    [
      'management',
      t(
        `databaseOverview.${connection.schemaManagement === 'external' ? 'external' : 'managed'}`,
      ),
    ],
    ['databaseName', connection.databaseName],
    [
      'schemas',
      connection.schemas?.length ? connection.schemas.join(', ') : undefined,
    ],
    ['driver', connection.driver],
    ['tablePrefix', connection.naming?.tablePrefix],
    [
      'underscored',
      connection.naming?.underscored === undefined
        ? undefined
        : t(
            `databaseOverview.${connection.naming.underscored ? 'enabled' : 'disabled'}`,
          ),
    ],
  ];
  return (
    <Collapsible className='pt-2'>
      <CollapsibleTrigger className='group flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground'>
        {t('databaseOverview.effectiveConfiguration')}
        <ChevronDown
          className='size-4 transition-transform group-data-[panel-open]:rotate-180'
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className='space-y-3 rounded-lg bg-muted/30 p-3'>
        <dl className='grid grid-cols-1 gap-3 text-sm sm:grid-cols-2'>
          {values
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => (
              <div key={key} className='min-w-0 space-y-1'>
                <dt className='text-xs text-muted-foreground'>
                  {t(`databaseOverview.fields.${key}`)}
                </dt>
                <dd className='break-words'>{value}</dd>
              </div>
            ))}
        </dl>
        <p className='text-xs leading-5 text-muted-foreground'>
          {t('databaseOverview.sourceNote')}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}
