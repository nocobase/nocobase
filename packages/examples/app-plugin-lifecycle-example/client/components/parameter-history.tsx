import type { ReactElement } from 'react';
import type { ParameterSnapshot } from '@nocobase/lifecycle';
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
          <h4>{t('parameters.firstSnapshot')}</h4>
          {data.snapshot && <SnapshotOrigins snapshot={data.snapshot} />}
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

export function SnapshotOrigins({
  snapshot,
}: {
  readonly snapshot: ParameterSnapshot;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <ul className='space-y-1 text-sm text-muted-foreground'>
      {Object.entries(snapshot.sources)
        .filter(([, source]) => source.origin === 'upgrade')
        .map(([field, source]) => (
          <li key={field}>
            {field}:{' '}
            {t('parameters.upgradeSource', { revision: source.revision })}
          </li>
        ))}
    </ul>
  );
}
