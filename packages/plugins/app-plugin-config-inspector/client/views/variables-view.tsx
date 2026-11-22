import { useState, type ReactElement } from 'react';

import type { InspectedVariable } from '../../shared/snapshot.js';
import { NoteBadge, Segment, Value, useInspectorT } from './shared.js';

/** The environment variables the application declares, set ones first. */
export function VariablesView({
  variables,
}: {
  variables: readonly InspectedVariable[];
}): ReactElement {
  const t = useInspectorT();
  const set = variables.filter((variable) => variable.set);
  const [filter, setFilter] = useState<'set' | 'all'>('set');
  const shown =
    filter === 'set'
      ? set
      : [...set, ...variables.filter((variable) => !variable.set)];
  return (
    <div className='grid gap-3'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-muted-foreground'>{t('variables.lead')}</p>
        <Segment
          label={t('views.variables')}
          value={filter}
          options={[
            ['set', t('variables.set', { count: set.length })],
            ['all', t('variables.all', { count: variables.length })],
          ]}
          onChange={setFilter}
        />
      </div>
      {shown.length ? (
        <div className='overflow-hidden rounded-lg border'>
          <div
            aria-hidden
            className='hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] gap-4 border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground sm:grid'
          >
            <span>{t('variables.name')}</span>
            <span>{t('variables.path')}</span>
            <span>{t('variables.value')}</span>
            <span className='w-28'>{t('variables.state')}</span>
          </div>
          <ul aria-label={t('views.variables')}>
            {shown.map((variable) => (
              <li
                key={variable.name}
                className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 border-b px-4 py-2.5 text-sm last:border-b-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto]'
              >
                <span className='min-w-0'>
                  <span className='block font-mono text-xs font-semibold break-all'>
                    {variable.name}
                  </span>
                  {variable.description ? (
                    <span className='block text-xs text-muted-foreground'>
                      {variable.description}
                    </span>
                  ) : null}
                </span>
                <span className='col-span-2 row-start-2 font-mono text-xs break-all text-muted-foreground sm:col-span-1 sm:col-start-2 sm:row-start-1'>
                  {variable.path}
                </span>
                <span className='col-span-2 row-start-3 min-w-0 sm:col-span-1 sm:col-start-3 sm:row-start-1'>
                  <Value value={variable.value ?? ''} />
                </span>
                <span className='col-start-2 row-start-1 flex flex-wrap content-start items-start justify-end gap-1 self-start sm:col-start-4 sm:w-28 sm:justify-start'>
                  {variable.set ? (
                    <NoteBadge tone='environment'>
                      {t('variables.isSet')}
                    </NoteBadge>
                  ) : (
                    <NoteBadge>{t('notSet')}</NoteBadge>
                  )}
                  {variable.firstStartOnly ? (
                    <NoteBadge tone='warning'>{t('firstStartOnly')}</NoteBadge>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className='rounded-lg border px-4 py-8 text-center text-sm text-muted-foreground'>
          {t('variables.none')}
        </p>
      )}
    </div>
  );
}
