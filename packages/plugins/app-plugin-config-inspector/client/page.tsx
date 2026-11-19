import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useState, type ReactElement } from 'react';

interface Snapshot {
  settings: {
    path: string;
    value: string;
    variable?: string;
    source: string;
  }[];
  yaml: string;
}
export default function ConfigInspector(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation('@nocobase/app-plugin-config-inspector');
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [failed, setFailed] = useState(false);
  const [file, setFile] = useState(false);
  const [search, setSearch] = useState('');
  useEffect(() => {
    let active = true;
    setSnapshot(undefined);
    setFailed(false);
    void api
      .request<{ data: Snapshot }>({ path: 'configInspector', query: {} })
      .then(
        ({ data }) => {
          if (active) setSnapshot(data);
        },
        () => {
          if (active) setFailed(true);
        },
      );
    return () => {
      active = false;
    };
  }, [api]);
  const rows = snapshot?.settings.filter((row) =>
    (row.path + ' ' + (row.variable ?? ''))
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const groups = new Map<string, NonNullable<typeof rows>>();
  for (const row of rows ?? []) {
    const module = row.path.split('.')[0];
    const group = groups.get(module);
    if (group) group.push(row);
    else groups.set(module, [row]);
  }
  return (
    <section className='mx-auto w-full max-w-5xl space-y-5 p-6'>
      <h1 className='text-2xl font-semibold'>{t('configInspector.title')}</h1>
      <div className='flex gap-2'>
        {[false, true].map((view) => (
          <button
            type='button'
            key={String(view)}
            aria-pressed={file === view}
            onClick={() => setFile(view)}
            className='rounded-md border px-3 py-2 aria-pressed:bg-muted'
          >
            {t(view ? 'configInspector.fileTab' : 'configInspector.effective')}
          </button>
        ))}
      </div>
      {failed ? (
        <p role='alert'>{t('configInspector.error')}</p>
      ) : !snapshot ? (
        <p role='status'>{t('configInspector.loading')}</p>
      ) : file ? (
        <pre className='overflow-auto rounded-md border p-4'>
          {snapshot.yaml}
        </pre>
      ) : (
        <>
          <input
            type='search'
            className='w-full rounded-md border px-3 py-2'
            value={search}
            aria-label={t('configInspector.search')}
            placeholder={t('configInspector.search')}
            onChange={(e) => setSearch(e.target.value)}
          />
          {rows?.length ? (
            <div className='space-y-4'>
              {Array.from(groups, ([module, settings]) => (
                <section key={module}>
                  <h2 className='font-medium'>{module}</h2>
                  <dl className='divide-y'>
                    {settings.map((row) => (
                      <div
                        key={row.path}
                        className='flex flex-wrap justify-between gap-3 py-3'
                      >
                        <dt>
                          <code>{row.path}</code>
                          {row.variable && (
                            <small className='block text-muted-foreground'>
                              {row.variable}
                            </small>
                          )}
                          {[
                            'users.initialAdmin.password',
                            'app.sampleData',
                          ].includes(row.path) && (
                            <small className='block text-muted-foreground'>
                              {t('configInspector.initialOnly')}
                            </small>
                          )}
                        </dt>
                        <dd>
                          {row.value === '[configured]'
                            ? t('configInspector.configured')
                            : row.value === '[hidden]'
                              ? t('configInspector.hidden')
                              : row.value}{' '}
                          <small className='text-muted-foreground'>
                            {t('configInspector.' + row.source)}
                          </small>
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          ) : (
            <p>{t('configInspector.empty')}</p>
          )}
        </>
      )}
    </section>
  );
}
