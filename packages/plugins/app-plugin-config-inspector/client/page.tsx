import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RotateCw } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react';

import { buildModules } from '../shared/modules.js';
import type { ConfigInspectorSnapshot } from '../shared/snapshot.js';
import { Alert, AlertAction, AlertDescription } from './components/ui/alert.js';
import { Button } from './components/ui/button.js';
import { Skeleton } from './components/ui/skeleton.js';
import { FileView } from './views/file-view.js';
import { ModulesView } from './views/modules-view.js';
import { Segment, useInspectorT } from './views/shared.js';
import { VariablesView } from './views/variables-view.js';

type View = 'modules' | 'variables' | 'file';

export default function ConfigInspector(): ReactElement {
  const api = useApiClient();
  const t = useInspectorT();
  const { i18n } = useTranslation('@nocobase/app-plugin-config-inspector');
  const [snapshot, setSnapshot] = useState<ConfigInspectorSnapshot>();
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('modules');
  // Only the latest request may update the page, so a slow earlier answer cannot replace a newer one.
  const latest = useRef(0);
  const load = useCallback(() => {
    const request = (latest.current += 1);
    const isActive = (): boolean => latest.current === request;
    setLoading(true);
    setFailed(false);
    void api
      .request<{ data: ConfigInspectorSnapshot }>({
        path: 'configInspector',
        query: {},
      })
      .then(
        ({ data }) => {
          if (isActive()) setSnapshot(data);
        },
        () => {
          if (isActive()) setFailed(true);
        },
      )
      .finally(() => {
        if (isActive()) setLoading(false);
      });
    return () => {
      if (isActive()) latest.current += 1;
    };
  }, [api]);
  useEffect(() => load(), [load]);
  const modules = useMemo(
    () => (snapshot ? buildModules(snapshot) : []),
    [snapshot],
  );

  const counts = useMemo(() => {
    const result = { file: 0, environment: 0, default: 0, customized: 0 };
    for (const setting of snapshot?.settings ?? []) {
      if (setting.customized) result.customized += 1;
      if (setting.source === 'file') result.file += 1;
      else if (setting.source === 'environment') result.environment += 1;
      else if (setting.source === 'default') result.default += 1;
    }
    return result;
  }, [snapshot]);

  return (
    <section className='mx-auto grid w-full max-w-6xl min-w-0 gap-4 p-4 sm:p-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='grid max-w-3xl gap-1'>
          <h1 className='text-xl font-semibold'>{t('title')}</h1>
          <p className='text-sm text-muted-foreground'>{t('lead')}</p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={loading}
          onClick={() => load()}
        >
          <RotateCw className={loading ? 'animate-spin' : undefined} />
          {t('refresh')}
        </Button>
      </div>
      {failed ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('error')}</AlertDescription>
          <AlertAction>
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={() => load()}
            >
              {t('retry')}
            </Button>
          </AlertAction>
        </Alert>
      ) : !snapshot ? (
        <div role='status' aria-busy className='grid gap-4'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-96 w-full' />
        </div>
      ) : (
        <>
          <dl className='grid grid-cols-2 overflow-hidden rounded-lg border bg-background lg:grid-cols-4'>
            <Fact label={t('facts.file')}>
              <span
                className='font-mono text-xs'
                title={snapshot.file.path ?? undefined}
              >
                {snapshot.file.exists ? snapshot.file.path : t('facts.noFile')}
              </span>
            </Fact>
            <Fact label={t('facts.loadedAt')}>
              {snapshot.loadedAt
                ? new Date(snapshot.loadedAt).toLocaleString(i18n.language)
                : '—'}
              {snapshot.reloads ? (
                <span className='ml-1 text-xs font-normal text-muted-foreground'>
                  · {t('facts.reloads', { count: snapshot.reloads })}
                </span>
              ) : null}
            </Fact>
            <Fact label={t('facts.customized')}>
              <span className='inline-flex items-center gap-1.5'>
                <span
                  aria-hidden
                  className='size-1.5 rounded-full bg-primary'
                />
                {t('facts.customizedCount', { count: counts.customized })}
              </span>
            </Fact>
            <Fact label={t('facts.sources')}>
              <span className='text-xs font-normal text-muted-foreground'>
                {t('source.file')}{' '}
                <b className='text-sm text-foreground'>{counts.file}</b> ·{' '}
                {t('source.environment')}{' '}
                <b className='text-sm text-foreground'>{counts.environment}</b>{' '}
                · {t('source.default')}{' '}
                <b className='text-sm text-foreground'>{counts.default}</b>
              </span>
            </Fact>
          </dl>
          <section className='grid min-w-0 gap-4 rounded-xl border bg-background p-4 sm:p-5'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <p className='text-sm text-muted-foreground'>
                {t(`leads.${view}`)}
              </p>
              <Segment
                label={t('views.label')}
                value={view}
                className='w-full sm:w-auto'
                options={[
                  ['modules', t('views.modules')],
                  ['variables', t('views.variables')],
                  ['file', t('views.file')],
                ]}
                onChange={setView}
              />
            </div>
            {view === 'modules' ? (
              <ModulesView modules={modules} customized={counts.customized} />
            ) : view === 'variables' ? (
              <VariablesView variables={snapshot.variables} />
            ) : (
              <FileView snapshot={snapshot} />
            )}
          </section>
        </>
      )}
    </section>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: ReactElement | (ReactElement | string | null)[] | string;
}): ReactElement {
  return (
    <div className='min-w-0 border-t border-l px-4 py-3 [&:nth-child(-n+2)]:border-t-0 [&:nth-child(odd)]:border-l-0 lg:border-t-0 lg:[&:nth-child(odd)]:border-l lg:first:border-l-0'>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className='mt-0.5 truncate text-sm font-semibold'>{children}</dd>
    </div>
  );
}
