import { ApiClientError, useApiClient } from '@nocobase/app-client';
import {
  DatabaseExplorerClient,
  type ConnectionListResult,
} from '@nocobase/app-plugin-database-explorer/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Database, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, buttonVariants } from '#components/ui/button';
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
  const stepNames = ['prepare', 'driver', 'configure', 'validate', 'restart'];
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
        {connections?.length ? (
          connections.map((connection) => (
            <ConfigurationItem
              key={connection.name}
              title={connection.name}
              state={true}
              icon={Database}
              description={[
                connection.dialect,
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
              ) : null}
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
          prompt={t('databaseOverview.agent.prompt', {
            databaseType: t('databaseOverview.agent.typePlaceholder'),
            connectionName: t('databaseOverview.agent.namePlaceholder'),
            purpose: t('databaseOverview.agent.purposePlaceholder'),
          })}
          steps={stepNames.map((key) =>
            t(`databaseOverview.addConnection.${key}`),
          )}
        />
        <ConfigurationAction
          title={t('featureOverview.layout.databaseTuneTitle')}
          description={t('featureOverview.layout.databaseTuneDescription')}
          prompt={t('featureOverview.layout.databaseTunePrompt')}
          steps={['default', 'management', 'transport', 'naming'].map((key) =>
            t(`databaseOverview.options.${key}.description`),
          )}
        />
      </ConfigurationActions>
    </div>
  );
}
