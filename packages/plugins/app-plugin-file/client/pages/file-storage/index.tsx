import { ClientApplicationContext } from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  FolderOpen,
  Loader2,
  Minus,
  X,
} from 'lucide-react';
import {
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link, useSearchParams } from 'react-router';

import {
  formatAgo,
  formatBytes,
  formatCount,
  useFileStorage,
  type CheckResult,
  type FileStorageView,
  type StorageDisk,
  type StorageUsage,
} from './data.js';

const NAMESPACE = '@nocobase/app-plugin-file';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * System settings › System › File storage: the disks the application's `drive` configuration declares, the features
 * that store files, and a check that a disk can really be written. Read-only apart from the check. The tab and the
 * open disk live in the URL (`?tab=usages`, `?disk=local`), so the page is one route an application can replace whole
 * through `routeComponentOverrides`.
 */
export default function FileStoragePage(): ReactElement {
  const storage = useFileStorage();
  const [params] = useSearchParams();
  const disk = params.get('disk');
  const { t, i18n } = useStorageTranslation(storage.data);
  const locale = i18n.language || 'en-US';

  let body: ReactNode;
  if (!storage.data) {
    body = storage.error ? (
      <div className='flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
        <span>{t('storage.loadFailed')}</span>
        <button type='button' className={buttonClass} onClick={storage.reload}>
          {t('storage.retry')}
        </button>
      </div>
    ) : (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Loader2 className='size-4 animate-spin' aria-hidden />
        {t('storage.loading')}
      </div>
    );
  } else if (disk !== null) {
    return (
      <section className='w-full space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8'>
        <DiskDetail
          name={disk}
          view={storage.data}
          check={storage.check}
          t={t}
          locale={locale}
        />
      </section>
    );
  } else {
    body = (
      <Overview
        view={storage.data}
        tab={params.get('tab') === 'usages' ? 'usages' : 'disks'}
        t={t}
        locale={locale}
      />
    );
  }
  return (
    <section className='w-full space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8'>
      <header className='space-y-1'>
        <h1 className='font-heading text-2xl font-semibold tracking-[-0.035em]'>
          {t('storage.title')}
        </h1>
        <p className='max-w-4xl text-sm leading-6 text-muted-foreground'>
          <CodeText text={t('storage.description')} />
        </p>
      </header>
      {body}
    </section>
  );
}

/** The plugin's namespace plus every namespace a feature's title comes from, so their translations load. */
function useStorageTranslation(view: FileStorageView | undefined) {
  const namespaces = useMemo(() => {
    const extra = new Set<string>();
    for (const usage of view?.usages ?? [])
      if (typeof usage.title === 'object' && usage.title.ns)
        extra.add(usage.title.ns);
    return [NAMESPACE, ...[...extra].sort()];
  }, [view]);
  const { t, i18n } = useTranslation(namespaces);
  return { t: t as unknown as Translate, i18n };
}

function Overview({
  view,
  tab,
  t,
  locale,
}: {
  readonly view: FileStorageView;
  readonly tab: 'disks' | 'usages';
  readonly t: Translate;
  readonly locale: string;
}): ReactElement {
  const [, setParams] = useSearchParams();
  return (
    <div className='space-y-4'>
      {tab === 'disks' && <Hints view={view} t={t} />}
      <div
        role='tablist'
        className='flex gap-5 border-b'
        aria-label={t('storage.title')}
      >
        {(['disks', 'usages'] as const).map((name) => (
          <button
            key={name}
            type='button'
            role='tab'
            aria-selected={tab === name}
            className={`-mb-px border-b-2 py-2 text-sm whitespace-nowrap ${
              tab === name
                ? 'border-foreground font-semibold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() =>
              setParams(name === 'usages' ? { tab: 'usages' } : {}, {
                replace: true,
              })
            }
          >
            {t(`storage.tabs.${name}`)}
            {name === 'usages' && (
              <span className='ml-1 text-xs text-muted-foreground'>
                {view.usages.length}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === 'disks' ? (
        <>
          <DiskList view={view} t={t} locale={locale} />
          <Notes
            t={t}
            items={['firstUse', 'changeDefault', 'noBrowser']}
            titled
          />
        </>
      ) : view.usages.length === 0 ? (
        <EmptyUsages view={view} t={t} />
      ) : (
        <>
          <UsageList usages={view.usages} view={view} t={t} locale={locale} />
          <Notes
            t={t}
            items={['readOnly', 'publicLinks', 'deleteRecords', 'noBrowser']}
          />
        </>
      )}
    </div>
  );
}

function Hints({
  view,
  t,
}: {
  readonly view: FileStorageView;
  readonly t: Translate;
}): ReactElement | null {
  const clusterPath = useClusterSettingsPath();
  const items: { readonly key: string; readonly node: ReactNode }[] = [];
  for (const disk of view.disks)
    if (!disk.complete)
      items.push({
        key: `incomplete-${disk.name}`,
        node: t('storage.hints.incomplete', {
          disk: disk.name,
          problems: problemsText(disk, t),
        }),
      });
  const defaultDisk = view.disks.find((disk) => disk.isDefault);
  if (defaultDisk?.driver === 'fs')
    items.push({
      key: 'local-default',
      node: (
        <>
          {t('storage.hints.localDefault')}{' '}
          {clusterPath ? (
            <Link to={clusterPath} className='underline underline-offset-2'>
              {t('storage.hints.seeCluster')}
            </Link>
          ) : (
            t('storage.hints.seeCluster')
          )}
        </>
      ),
    });
  if (items.length === 0) return null;
  return (
    <div
      role='status'
      className='flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-200'
    >
      <AlertTriangle className='mt-0.5 size-4 shrink-0' aria-hidden />
      <div className='space-y-1'>
        <p className='font-semibold'>
          {t('storage.hints.title', { count: items.length })}
        </p>
        <ul className='list-disc space-y-1 pl-4'>
          {items.map((item) => (
            <li key={item.key}>{item.node}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** The cluster settings page, when the application has one; the hint names it without a link otherwise. */
function useClusterSettingsPath(): string | undefined {
  const app = useContext(ClientApplicationContext);
  return useMemo(() => {
    const visit = (
      routes: readonly AppClientRegisteredRoute[],
    ): string | undefined => {
      for (const route of routes) {
        if (route.componentLoader && /\/settings\/cluster$/.test(route.path))
          return route.path;
        const found = visit(route.children ?? []);
        if (found) return found;
      }
      return undefined;
    };
    return app ? visit(app.runtime.routes) : undefined;
  }, [app]);
}

const gridDisks =
  'md:grid md:grid-cols-[minmax(7rem,0.8fr)_minmax(12rem,1.6fr)_6rem_7rem_6rem_minmax(10rem,1.2fr)_5rem] md:items-center md:gap-3';

function DiskList({
  view,
  t,
  locale,
}: {
  readonly view: FileStorageView;
  readonly t: Translate;
  readonly locale: string;
}): ReactElement {
  return (
    <div className='rounded-xl border bg-card text-card-foreground'>
      <div
        className={`hidden rounded-t-xl bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground ${gridDisks}`}
      >
        <div>{t('storage.columns.name')}</div>
        <div>{t('storage.columns.type')}</div>
        <div>{t('storage.columns.visibility')}</div>
        <div>{t('storage.columns.maxFileSize')}</div>
        <div>{t('storage.columns.usages')}</div>
        <div>{t('storage.columns.status')}</div>
        <div />
      </div>
      {view.disks.map((disk) => {
        const count = view.usages.filter(
          (usage) => usage.disk === disk.name,
        ).length;
        return (
          <div
            key={disk.name}
            data-disk={disk.name}
            className={`grid gap-1.5 border-t px-4 py-3 text-sm first:border-t-0 md:first:border-t ${gridDisks}`}
          >
            <div className='flex flex-wrap items-center gap-2'>
              <span className='font-semibold'>{disk.name}</span>
              {disk.isDefault && <DefaultBadge t={t} />}
            </div>
            <div>
              <div>{t(`storage.drivers.${disk.driver}`)}</div>
              <div className='text-xs text-muted-foreground'>
                <code className={codeClass}>{disk.driver}</code> ·{' '}
                {locationText(disk, t)}
              </div>
            </div>
            <Cell label={t('storage.columns.visibility')}>
              {disk.visibility
                ? t(`storage.visibility.${disk.visibility}`)
                : t('storage.visibility.unknown')}
            </Cell>
            <Cell label={t('storage.columns.maxFileSize')}>
              {t('storage.sizeMb', {
                size: formatCount(disk.maxFileSizeMb, locale),
              })}
            </Cell>
            <Cell label={t('storage.columns.usages')}>
              {t('storage.usageCount', { count })}
            </Cell>
            <div>
              <DiskStatus disk={disk} t={t} locale={locale} />
            </div>
            <div className='md:text-right'>
              <Link
                to={{ search: `?disk=${encodeURIComponent(disk.name)}` }}
                className={buttonClass}
                aria-label={`${t('storage.details')} ${disk.name}`}
              >
                {t('storage.details')}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** A value with its column name shown in front of it on a phone, where the header row is hidden. */
function Cell({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div>
      <span className='mr-1 text-xs text-muted-foreground md:hidden'>
        {label}:
      </span>
      {children}
    </div>
  );
}

function DiskStatus({
  disk,
  t,
  locale,
}: {
  readonly disk: StorageDisk;
  readonly t: Translate;
  readonly locale: string;
}): ReactElement {
  if (!disk.complete)
    return (
      <div className='space-y-0.5'>
        <Tag tone='bad'>
          <X className='size-3' aria-hidden />
          {t('storage.status.incomplete')}
        </Tag>
        <div className='text-xs text-muted-foreground'>
          {problemsText(disk, t)}
        </div>
      </div>
    );
  if (!disk.lastCheck)
    return <Tag tone='muted'>{t('storage.status.unchecked')}</Tag>;
  return (
    <div className='space-y-0.5'>
      {disk.lastCheck.ok ? (
        <Tag tone='good'>
          <Check className='size-3' aria-hidden />
          {t('storage.status.ok')}
        </Tag>
      ) : (
        <Tag tone='bad'>
          <X className='size-3' aria-hidden />
          {t('storage.status.failed')}
        </Tag>
      )}
      <div className='text-xs text-muted-foreground'>
        {t('storage.status.checkedAgo', {
          time: formatAgo(disk.lastCheck.checkedAt, locale),
        })}
      </div>
    </div>
  );
}

const gridUsages =
  'md:grid md:grid-cols-[minmax(10rem,1fr)_minmax(9rem,1fr)_minmax(11rem,1.3fr)_9rem_minmax(9rem,1fr)] md:items-center md:gap-3';

function UsageList({
  usages,
  view,
  t,
  locale,
  bare,
}: {
  readonly usages: readonly StorageUsage[];
  readonly view: FileStorageView;
  readonly t: Translate;
  readonly locale: string;
  readonly bare?: boolean;
}): ReactElement {
  const rows = (
    <>
      <div
        className={`hidden bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground ${bare ? 'border-t' : 'rounded-t-xl'} ${gridUsages}`}
      >
        <div>{t('storage.columns.feature')}</div>
        <div>{t('storage.columns.collection')}</div>
        <div>{t('storage.columns.disk')}</div>
        <div>{t('storage.columns.download')}</div>
        <div>{t('storage.columns.files')}</div>
      </div>
      {usages.map((usage) => (
        <div
          key={usage.id}
          data-usage={usage.id}
          className={`grid gap-1.5 border-t px-4 py-3 text-sm ${bare ? '' : 'first:border-t-0 md:first:border-t'} ${gridUsages}`}
        >
          <div>
            <div className='font-semibold'>{usageTitle(usage, t)}</div>
            <div className='text-xs text-muted-foreground'>
              {usage.plugin
                ? t('storage.plugin', { plugin: pluginName(usage.plugin) })
                : t('storage.application')}
            </div>
          </div>
          <div>
            <code className={codeClass}>{usage.collection}</code>
          </div>
          <Cell label={t('storage.columns.disk')}>
            {usageDiskText(usage, view, t)}
          </Cell>
          <div>
            {usage.download === 'public' ? (
              <Tag tone='warn'>{t('storage.download.public')}</Tag>
            ) : (
              <Tag tone='good'>{t('storage.download.authenticated')}</Tag>
            )}
          </div>
          <Cell label={t('storage.columns.files')}>
            <span className='text-muted-foreground'>
              {usage.stats
                ? t('storage.filesValue', {
                    files: formatCount(usage.stats.files, locale),
                    size: formatBytes(usage.stats.bytes, locale),
                  })
                : t('storage.filesUnavailable')}
            </span>
          </Cell>
        </div>
      ))}
    </>
  );
  if (bare) return rows;
  return (
    <div className='rounded-xl border bg-card text-card-foreground'>{rows}</div>
  );
}

function EmptyUsages({
  view,
  t,
}: {
  readonly view: FileStorageView;
  readonly t: Translate;
}): ReactElement {
  return (
    <div className='space-y-3'>
      <div className='flex flex-col items-center gap-2 rounded-xl border bg-card px-5 py-10 text-center text-card-foreground'>
        <FolderOpen className='size-8 text-muted-foreground' aria-hidden />
        <p className='font-semibold'>{t('storage.empty.title')}</p>
        <p className='max-w-xl text-sm text-muted-foreground'>
          {t('storage.empty.description')}
        </p>
      </div>
      <p className='text-sm text-muted-foreground'>
        {t('storage.empty.defaultDisk', { disk: view.defaultDisk })}
      </p>
    </div>
  );
}

function DiskDetail({
  name,
  view,
  check,
  t,
  locale,
}: {
  readonly name: string;
  readonly view: FileStorageView;
  readonly check: (disk: string) => Promise<CheckResult>;
  readonly t: Translate;
  readonly locale: string;
}): ReactElement {
  const disk = view.disks.find((item) => item.name === name);
  const usages = view.usages.filter((usage) => usage.disk === name);
  const crumb = (
    <nav className='flex items-center gap-1 text-xs text-muted-foreground'>
      <Link to={{ search: '' }} className='underline underline-offset-2'>
        {t('storage.backToList')}
      </Link>
      <ChevronRight className='size-3' aria-hidden />
      <span>{name}</span>
    </nav>
  );
  if (!disk)
    return (
      <div className='space-y-3'>
        {crumb}
        <p className='text-sm'>{t('storage.notFound', { disk: name })}</p>
      </div>
    );
  const rows: [string, ReactNode, 'code' | 'config' | 'default'][] = [
    [
      t('storage.settings.driver'),
      `${t(`storage.drivers.${disk.driver}`)} (${disk.driver})`,
      disk.sources.driver,
    ],
    [
      t('storage.settings.location'),
      locationText(disk, t),
      disk.sources.location,
    ],
    [
      t('storage.settings.visibility'),
      disk.visibility
        ? t(`storage.visibility.${disk.visibility}Long`)
        : t('storage.visibility.unknown'),
      disk.sources.visibility,
    ],
    [
      t('storage.settings.maxFileSize'),
      t('storage.sizeMb', { size: formatCount(disk.maxFileSizeMb, locale) }),
      disk.sources.maxFileSizeMb,
    ],
    [
      t('storage.settings.urls'),
      t(`storage.urls.${disk.urls}`),
      disk.sources.visibility,
    ],
  ];
  return (
    <div className='space-y-4'>
      <div className='space-y-1'>
        {crumb}
        <h1 className='flex flex-wrap items-center gap-2 font-heading text-2xl font-semibold tracking-[-0.035em]'>
          {disk.name}
          {disk.isDefault && <DefaultBadge t={t} />}
        </h1>
        <p className='text-sm text-muted-foreground'>
          {t(`storage.drivers.${disk.driver}`)} ·{' '}
          {disk.isDefault
            ? t('storage.defaultSubtitle')
            : t('storage.notDefaultSubtitle')}
        </p>
      </div>
      <div className='rounded-xl border bg-card text-card-foreground'>
        <div className='hidden rounded-t-xl bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid md:grid-cols-[minmax(8rem,1fr)_minmax(12rem,1.8fr)_8rem] md:gap-3'>
          <div>{t('storage.columns.setting')}</div>
          <div>{t('storage.columns.value')}</div>
          <div>{t('storage.columns.source')}</div>
        </div>
        {rows.map(([label, value, source]) => (
          <div
            key={label}
            className='grid gap-1 border-t px-4 py-3 text-sm first:border-t-0 md:grid-cols-[minmax(8rem,1fr)_minmax(12rem,1.8fr)_8rem] md:items-center md:gap-3 md:first:border-t'
          >
            <div className='font-semibold'>{label}</div>
            <div>{value}</div>
            <div>
              <span className='rounded border px-1.5 text-xs text-muted-foreground'>
                {t(`storage.sources.${source}`)}
              </span>
            </div>
          </div>
        ))}
        <details className='border-t px-4 py-3 text-sm'>
          <summary className='cursor-pointer text-primary'>
            {t('storage.howToChange')}
          </summary>
          <pre className='mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs'>
            {configSnippet(disk)}
          </pre>
          <p className='mt-2 text-xs text-muted-foreground'>
            <CodeText text={t('storage.howToChangeNote')} />
          </p>
        </details>
      </div>
      <CheckPanel
        disk={disk}
        canCheck={view.canCheck}
        check={check}
        t={t}
        locale={locale}
      />
      <div className='rounded-xl border bg-card text-card-foreground'>
        <div className='flex items-center gap-2 px-4 py-3 text-sm'>
          <span className='font-semibold'>{t('storage.usedBy')}</span>
          <span className='text-xs text-muted-foreground'>
            {t('storage.usageCount', { count: usages.length })}
          </span>
        </div>
        {usages.length === 0 ? (
          <p className='border-t px-4 py-3 text-sm text-muted-foreground'>
            {t('storage.noUsagesOnDisk')}
          </p>
        ) : (
          <UsageList usages={usages} view={view} t={t} locale={locale} bare />
        )}
      </div>
    </div>
  );
}

function CheckPanel({
  disk,
  canCheck,
  check,
  t,
  locale,
}: {
  readonly disk: StorageDisk;
  readonly canCheck: boolean;
  readonly check: (disk: string) => Promise<CheckResult>;
  readonly t: Translate;
  readonly locale: string;
}): ReactElement {
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);
  const [latest, setLatest] = useState<CheckResult>();
  const result = latest ?? disk.lastCheck ?? undefined;
  const run = () => {
    setRunning(true);
    setFailed(false);
    check(disk.name)
      .then(setLatest, () => setFailed(true))
      .finally(() => setRunning(false));
  };
  return (
    <div className='space-y-3 rounded-xl border bg-card p-4 text-sm text-card-foreground'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='font-semibold'>{t('storage.check.title')}</span>
        {result && (
          <span className='text-xs text-muted-foreground'>
            {formatAgo(result.checkedAt, locale)}
          </span>
        )}
        <span className='flex-1' />
        {canCheck && (
          <button
            type='button'
            className={buttonClass}
            disabled={running}
            onClick={run}
          >
            {running && (
              <Loader2 className='size-3.5 animate-spin' aria-hidden />
            )}
            {running
              ? t('storage.check.running')
              : result
                ? t('storage.check.rerun')
                : t('storage.check.run')}
          </button>
        )}
      </div>
      {failed && (
        <p className='text-destructive'>{t('storage.check.failed')}</p>
      )}
      {result ? (
        <ol className='space-y-2'>
          {result.steps.map((step) => (
            <li key={step.step} className='flex items-start gap-2.5'>
              <StepIcon status={step.status} />
              <div>
                <div className='font-semibold'>
                  {t(`storage.check.steps.${step.step}`)}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {stepDetail(step, disk, t)}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className='text-muted-foreground'>{t('storage.check.never')}</p>
      )}
      <p className='text-xs text-muted-foreground'>
        <CodeText text={t('storage.check.scope')} />
      </p>
    </div>
  );
}

function StepIcon({
  status,
}: {
  readonly status: CheckResult['steps'][number]['status'];
}): ReactElement {
  const base =
    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs';
  if (status === 'passed')
    return (
      <span
        className={`${base} bg-emerald-500/10 text-emerald-700 dark:text-emerald-400`}
      >
        <Check className='size-3' aria-label='passed' />
      </span>
    );
  if (status === 'failed')
    return (
      <span className={`${base} bg-destructive/10 text-destructive`}>
        <X className='size-3' aria-label='failed' />
      </span>
    );
  return (
    <span className={`${base} bg-muted text-muted-foreground`}>
      <Minus className='size-3' aria-label='skipped' />
    </span>
  );
}

function stepDetail(
  step: CheckResult['steps'][number],
  disk: StorageDisk,
  t: Translate,
): string {
  if (step.status === 'failed') {
    const reason = step.reason ?? 'unknown';
    const detail =
      reason === 'CONFIG_INCOMPLETE' ? problemsText(disk, t) : undefined;
    const text = t(`storage.check.reasons.${reason}`, {
      detail,
      defaultValue: t('storage.check.reasons.unknown'),
    });
    return step.errorName ? `${text} (${step.errorName})` : text;
  }
  if (step.status === 'skipped') return t('storage.check.details.skipped');
  switch (step.step) {
    case 'write':
      return step.detail ?? '';
    case 'read':
      return t('storage.check.details.bytes', { bytes: step.detail });
    case 'url':
      return t(`storage.check.details.${step.detail ?? 'APPLICATION'}`);
    default:
      return t('storage.check.details.deleted');
  }
}

function Notes({
  t,
  items,
  titled,
}: {
  readonly t: Translate;
  readonly items: readonly string[];
  readonly titled?: boolean;
}): ReactElement {
  return (
    <div className='space-y-1 text-sm text-muted-foreground'>
      {titled && (
        <p className='font-semibold text-foreground'>
          {t('storage.notes.title')}
        </p>
      )}
      <ul className='list-disc space-y-1 pl-5'>
        {items.map((item) => (
          <li key={item}>
            <CodeText text={t(`storage.notes.${item}`)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DefaultBadge({ t }: { readonly t: Translate }): ReactElement {
  return (
    <span className='rounded bg-primary/10 px-1.5 text-xs font-medium text-primary'>
      {t('storage.default')}
    </span>
  );
}

function Tag({
  tone,
  children,
}: {
  readonly tone: 'good' | 'bad' | 'warn' | 'muted';
  readonly children: ReactNode;
}): ReactElement {
  const tones = {
    good: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    bad: 'bg-destructive/10 text-destructive',
    warn: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    muted: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded px-1.5 text-xs whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Renders `code` spans written in backticks inside a translated sentence. */
function CodeText({ text }: { readonly text: string }): ReactElement {
  // Keyed by where each part starts in the sentence, which stays the same while the sentence does.
  const parts = text
    .split('`')
    .reduce<{ part: string; code: boolean; start: number }[]>(
      (list, part, position) => {
        const previous = list.at(-1);
        const start = previous ? previous.start + previous.part.length + 1 : 0;
        return [...list, { part, code: position % 2 === 1, start }];
      },
      [],
    );
  return (
    <>
      {parts.map(({ part, code, start }) =>
        code ? (
          <code key={start} className={codeClass}>
            {part}
          </code>
        ) : (
          <span key={start}>{part}</span>
        ),
      )}
    </>
  );
}

const codeClass = 'rounded bg-muted px-1 py-px font-mono text-xs';
const buttonClass =
  'inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-sm font-medium whitespace-nowrap hover:bg-muted disabled:opacity-60';

function locationText(disk: StorageDisk, t: Translate): string {
  const { location } = disk;
  if (disk.driver === 'fs') {
    if (location.outsideApp) return t('storage.location.outsideApp');
    return location.path
      ? t('storage.location.inApp', { path: location.path })
      : t('storage.problems.LOCATION_MISSING');
  }
  if (disk.driver === 'custom') return t('storage.location.unknown');
  return [
    location.bucket ?? t('storage.location.bucketMissing'),
    location.region,
    location.endpointHost,
  ]
    .filter(Boolean)
    .join(' · ');
}

function problemsText(disk: StorageDisk, t: Translate): string {
  return disk.problems
    .map((problem) => t(`storage.problems.${problem}`))
    .join(', ');
}

function usageTitle(usage: StorageUsage, t: Translate): string {
  if (typeof usage.title === 'string') return usage.title;
  return t(usage.title.key, {
    ns: usage.title.ns ?? NAMESPACE,
    defaultValue: usage.title.defaultValue ?? usage.title.key,
  });
}

function usageDiskText(
  usage: StorageUsage,
  view: FileStorageView,
  t: Translate,
): string {
  if (usage.diskSource === 'config' && usage.configPath)
    return usage.followsDefault
      ? t('storage.diskConfigDefault', {
          path: usage.configPath,
          disk: view.defaultDisk,
        })
      : t('storage.diskConfig', { path: usage.configPath, disk: usage.disk });
  if (usage.diskSource === 'default')
    return t('storage.diskDefault', { disk: usage.disk });
  return usage.disk;
}

/** `@nocobase/app-plugin-projects` reads as `projects`. */
function pluginName(plugin: string): string {
  return plugin.replace(/^@nocobase\/app-plugin-/, '');
}

/** A `config.yml` example for this disk: names and placeholders only, never the current values. */
function configSnippet(disk: StorageDisk): string {
  const lines = [
    '# config.yml',
    'drive:',
    `  default: ${disk.name}        # later uploads go here; existing files are not moved`,
    '  disks:',
    `    ${disk.name}:`,
    '      maxFileSizeMb: 50    # max size of one file, in MB',
  ];
  if (disk.driver === 's3' || disk.driver === 'oss')
    lines.push(
      '      bucket: my-bucket',
      '      region: us-east-1',
      '      credentials:         # supply through environment variables, never commit them',
      '        accessKeyId: ...',
      disk.driver === 's3'
        ? '        secretAccessKey: ...'
        : '        accessKeySecret: ...',
    );
  return lines.join('\n');
}
