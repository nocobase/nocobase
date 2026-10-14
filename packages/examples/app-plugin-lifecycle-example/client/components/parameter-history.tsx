import type { ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { parameterApi } from '../lib/parameter-api.js';
import { useLoader } from '../lib/use-loader.js';
import { NAMESPACE } from '../lib/format.js';

export function ParameterHistory({
  lifecycle,
  recordId,
  actor,
  version,
  refresh,
}: {
  readonly lifecycle: string;
  readonly recordId: string;
  readonly actor: string;
  readonly version: number | null;
  readonly refresh?: number;
}): ReactElement {
  const api = parameterApi(useApiClient(), actor);
  const { t } = useTranslation(NAMESPACE);
  const { data, error } = useLoader(
    () => api.history(lifecycle, recordId),
    `parameterHistory:${lifecycle}:${recordId}:${actor}`,
    `${version}:${refresh ?? 0}`,
  );
  return (
    <section className='space-y-2 text-sm'>
      <h3 className='font-medium'>{t('parameters.history')}</h3>
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
      {data && (
        <>
          <p className='text-muted-foreground'>
            {t('parameters.historyBoundary')}
          </p>
          <h4>{t('parameters.effectivePreview')}</h4>
          <pre className='overflow-auto rounded-lg bg-muted p-2 text-xs'>
            {JSON.stringify(data.current, null, 2)}
          </pre>
          <h4>{t('parameters.firstSnapshot')}</h4>
          <pre className='overflow-auto rounded-lg bg-muted p-2 text-xs'>
            {data.snapshot
              ? JSON.stringify(data.snapshot, null, 2)
              : t('parameters.notRecorded')}
          </pre>
          {!data.recorded && <p>{t('parameters.notRecorded')}</p>}
          {data.usages.map((usage) => (
            <div
              key={`${usage.kind}:${usage.associationId}:${usage.attempt ?? 0}`}
              className='rounded-lg border p-2'
            >
              <p>
                {usage.kind} · {usage.associationId}
                {usage.attempt ? ` · ${usage.attempt}` : ''} · {usage.at}
              </p>
              <pre className='overflow-auto text-xs'>
                {JSON.stringify(
                  { values: usage.values, sources: usage.sources },
                  null,
                  2,
                )}
              </pre>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
