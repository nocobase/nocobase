import {
  ApiClientError,
  useApiClient,
  useClientApplication,
} from '@nocobase/app-client';
import {
  fetchFoundationRegistrations,
  type FoundationRegistrations,
} from '@nocobase/app-plugin-foundation/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState } from 'react';
import { StatusBadge } from '#components/status-badge';
import { Button } from '#components/ui/button';
import packageMetadata from '../../../package.json' with { type: 'json' };

interface PluginIntegration {
  readonly packageName: string;
  readonly mode: 'full' | 'service';
  readonly label?: string;
}

/** Registration facts only; no configuration values, permission records or business scans. */
export default function PluginIntegrationStatus({
  plugins,
}: {
  plugins: readonly PluginIntegration[];
}) {
  const { t } = useTranslation(packageMetadata.name);
  const api = useApiClient();
  const { runtime } = useClientApplication();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    { data: FoundationRegistrations } | { error: unknown }
  >();
  useEffect(() => {
    let active = true;
    fetchFoundationRegistrations(api).then(
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
  return (
    <div className='space-y-3'>
      <dl className='space-y-3'>
        {plugins.map((entry) => {
          const client =
            entry.mode === 'service'
              ? true
              : runtime.registeredPlugins?.some(
                  (plugin) => plugin.packageName === entry.packageName,
                );
          const server =
            result && 'data' in result
              ? result.data.serverPlugins?.includes(entry.packageName)
              : undefined;
          const status = !result
            ? 'loading'
            : client === undefined || server === undefined
              ? 'unknown'
              : entry.mode === 'service'
                ? server
                  ? 'connected'
                  : 'pending'
                : client && server
                  ? 'connected'
                  : client || server
                    ? 'partial'
                    : 'pending';
          return (
            <div
              key={entry.packageName}
              className='flex flex-wrap items-center justify-between gap-2 text-sm'
            >
              <dt className={entry.label ? 'font-medium' : 'sr-only'}>
                {entry.label ?? entry.packageName}
              </dt>
              <dd>
                <StatusBadge
                  size='sm'
                  tone={status === 'connected' ? 'info' : 'neutral'}
                >
                  {t(`featureOverview.status.${status}`)}
                </StatusBadge>
              </dd>
            </div>
          );
        })}
      </dl>
      <p role='status' className='text-xs leading-5 text-muted-foreground'>
        {t('featureOverview.statusHint')}
      </p>
      {result && 'error' in result ? (
        <p role='alert' className='text-sm text-muted-foreground'>
          {t(
            `featureOverview.${errorStatus === 401 ? 'expired' : errorStatus === 403 ? 'forbidden' : 'failed'}`,
          )}
        </p>
      ) : null}
      {errorStatus !== 401 && errorStatus !== 403 ? (
        <Button
          variant='outline'
          size='sm'
          disabled={!result}
          onClick={() => {
            setResult(undefined);
            setAttempt((value) => value + 1);
          }}
        >
          {t('featureOverview.refresh')}
        </Button>
      ) : null}
    </div>
  );
}
