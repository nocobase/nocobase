import { useClientApplication } from '@nocobase/app-client';
import { cn } from 'cn';
import { Layers, Package, Plug, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactElement } from 'react';

import {
  FOUNDATION_HIGHLIGHTS,
  type FoundationCapability,
  type FoundationBusinessModule,
  type FoundationCapabilityKey,
  type FoundationOverview,
  type FoundationProviderInventory,
  type FoundationStatus,
} from '../../shared/foundation.js';
import { withAvailableCapabilities } from '../../shared/available-capabilities.js';
import { businessModules } from '../business-modules.js';
import { Button } from './ui/button.js';
import { Skeleton } from './ui/skeleton.js';
import { ModuleMatrix } from './module-matrix.js';
import { CollectionsBrowser } from './collections-browser.js';
import { useFoundationTranslation } from './foundation-translation.js';

import { useFoundationOverview } from '../api.js';
import {
  clientProviderNames,
  withClientProviders,
} from '../provider-inventory.js';
import { CAPABILITY_ICONS } from './capability-icons.js';
import { formatFactParams, formatMetricValue, formatTime } from './format.js';

export function FoundationPage(): ReactElement {
  const { t } = useFoundationTranslation();
  const app = useClientApplication();
  const { overview, error, loading, refresh, countRecords } =
    useFoundationOverview();

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='font-heading text-2xl font-semibold'>
          {t('page.title')}
        </h1>
        <p className='max-w-3xl text-sm text-muted-foreground'>
          {t('page.description')}
        </p>
      </header>
      {overview && error !== 'forbidden' ? (
        <>
          {error === 'failed' ? (
            <p
              role='alert'
              className='rounded-lg border px-4 py-3 text-sm text-muted-foreground'
            >
              {t('page.refreshFailed')}
            </p>
          ) : null}
          <FoundationOverviewView
            overview={overview}
            clientProviders={clientProviderNames(app)}
            registeredRoutes={app.runtime.routes}
            refreshing={loading}
            onRefresh={refresh}
            onCountRecords={countRecords}
          />
        </>
      ) : error ? (
        <div
          role='alert'
          className='flex flex-col items-start gap-3 rounded-lg border bg-card p-6 text-sm'
        >
          <p>
            {t(error === 'forbidden' ? 'page.forbidden' : 'page.loadFailed')}
          </p>
          {error === 'failed' ? (
            <button
              type='button'
              onClick={refresh}
              className='rounded-md border border-input px-3 py-1.5 hover:bg-hover'
            >
              {t('page.retry')}
            </button>
          ) : null}
        </div>
      ) : (
        <section
          aria-busy='true'
          aria-label={t('page.loading')}
          className='flex flex-col gap-4 rounded-lg border bg-card p-6'
        >
          <p role='status' className='text-sm text-muted-foreground'>
            {t('page.loading')}
          </p>
          <div aria-hidden='true' className='flex flex-col gap-4'>
            <Skeleton className='h-8 w-48 motion-reduce:animate-none' />
            <Skeleton className='h-24 w-full motion-reduce:animate-none' />
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton
                  key={index}
                  className='h-16 motion-reduce:animate-none'
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export interface FoundationOverviewViewProps {
  readonly overview: FoundationOverview;
  readonly refreshing?: boolean;
  readonly onRefresh?: () => void;
  readonly onCountRecords?: () => void;
  readonly clientProviders?: readonly string[];
  readonly registeredRoutes?: Parameters<typeof businessModules>[0];
}

/** The band, the key numbers and the selected capability's details, for a page that loads the overview itself. */
export function FoundationOverviewView({
  overview: serverOverview,
  refreshing = false,
  onRefresh,
  onCountRecords,
  clientProviders = [],
  registeredRoutes = [],
}: FoundationOverviewViewProps): ReactElement {
  const { t, locale, text } = useFoundationTranslation();
  const overview = useMemo(() => {
    const resolved = serverOverview.inventory
      ? withAvailableCapabilities(
          serverOverview,
          withClientProviders(serverOverview.inventory, clientProviders),
        )
      : serverOverview;
    return {
      ...resolved,
      capabilities: resolved.availableCapabilities ?? resolved.capabilities,
    };
  }, [serverOverview, clientProviders]);
  const active = useMemo(
    () => overview.capabilities.filter((entry) => entry.status === 'active'),
    [overview],
  );
  const lit = active.length;
  const [selected, setSelected] = useState<FoundationCapabilityKey>(
    () => active[0]?.key ?? overview.capabilities[0]?.key ?? 'dataModeling',
  );
  const counts = useMemo(() => countStatuses(overview), [overview]);
  const modules = useMemo(
    () =>
      businessModules(
        registeredRoutes,
        overview.inventory,
        overview.moduleSources,
        overview.capabilities.map((entry) => entry.key),
      ),
    [registeredRoutes, overview],
  );
  const [focusedModule, setFocusedModule] = useState<string | null>(null);
  const focused = modules.find((module) => module.id === focusedModule);
  const focusKeys = focused
    ? new Set(focused.links.map((link) => link.capability))
    : undefined;
  const selectedCapability =
    overview.capabilities.find((entry) => entry.key === selected) ??
    overview.capabilities[0];
  if (selectedCapability && selected !== selectedCapability.key)
    setSelected(selectedCapability.key);
  const select = useCallback((key: FoundationCapabilityKey) => {
    setSelected(key);
    document
      .getElementById('foundation-capability-detail')
      ?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, []);

  return (
    <>
      <section
        aria-labelledby='foundation-band-title'
        className='overflow-hidden rounded-xl border bg-card text-card-foreground'
      >
        <div className='flex flex-wrap items-end justify-between gap-4 p-4 md:p-5'>
          <div className='flex min-w-0 flex-col gap-1'>
            <h2
              id='foundation-band-title'
              className='flex items-center gap-2 font-heading text-base font-medium'
            >
              <Layers className='size-4 text-primary' aria-hidden />
              {t('page.bandTitle')}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {t('page.bandDescription')}
            </p>
          </div>
          <div className='flex items-end gap-3'>
            <div className='text-right'>
              <p
                className='font-heading text-4xl font-semibold tabular-nums'
                aria-live='polite'
              >
                {t('page.score', {
                  active: Math.min(lit, active.length),
                  total: overview.capabilities.length,
                })}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t('page.scoreCaption')}
              </p>
            </div>
            <div className='flex gap-2'>
              {onRefresh ? (
                <button
                  type='button'
                  onClick={onRefresh}
                  disabled={refreshing}
                  className='inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm hover:bg-hover disabled:opacity-60'
                >
                  <RefreshCw
                    className={cn(
                      'size-3.5',
                      refreshing && 'motion-safe:animate-spin',
                    )}
                    aria-hidden
                  />
                  {t(refreshing ? 'page.refreshing' : 'page.refresh')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <CapabilityBand
          capabilities={overview.capabilities}
          active={active}
          lit={lit}
          selected={selected}
          onSelect={select}
          focusKeys={focusKeys}
        />
        {modules.length ? (
          <div
            aria-label={t('matrix.modules')}
            className='flex flex-wrap items-center gap-2 border-t px-4 py-3 md:px-5'
          >
            <span className='mr-1 text-xs text-muted-foreground'>
              {t('matrix.modules')}
            </span>
            {modules.map((module) => (
              <Button
                key={module.id}
                variant='outline'
                size='xs'
                aria-pressed={module.id === focusedModule}
                className={cn(
                  'h-7! rounded-full! border-border bg-card px-3 text-sm font-normal shadow-none',
                  module.id === focusedModule &&
                    'border-primary/40 bg-primary/10 text-primary',
                )}
                onMouseEnter={() => setFocusedModule(module.id)}
                onMouseLeave={() => setFocusedModule(null)}
                onFocus={() => setFocusedModule(module.id)}
                onBlur={() => setFocusedModule(null)}
                onClick={() => setFocusedModule(module.id)}
              >
                {text(module.title)}{' '}
                <span className='tabular-nums text-muted-foreground'>
                  {module.links.length}
                </span>
              </Button>
            ))}
          </div>
        ) : null}
        <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t px-4 py-3 text-xs text-muted-foreground md:px-5'>
          <ul className='flex flex-wrap gap-x-4 gap-y-1'>
            <LegendItem
              status='active'
              label={t('status.legendActive', { count: counts.active })}
            />
            <LegendItem
              status='needsSetup'
              label={t('status.legendNeedsSetup', { count: counts.needsSetup })}
            />
            <LegendItem
              status='unused'
              label={t('status.legendUnused', { count: counts.unused })}
            />
            {counts.undetermined > 0 ? (
              <li className='flex items-center gap-1.5 text-muted-foreground'>
                {t('page.undetermined', { count: counts.undetermined })}
              </li>
            ) : null}
          </ul>
          <span>
            {t('page.updatedAt', {
              time: formatTime(overview.checkedAt, locale),
            })}
          </span>
        </div>
      </section>

      <Highlights overview={overview} onSelect={select} />

      {selectedCapability ? (
        <CapabilityDetail
          capability={selectedCapability}
          inventory={overview.inventory}
          counting={refreshing}
          onCountRecords={onCountRecords}
          recordCountCheckedAt={overview.recordCountCheckedAt}
          modules={modules.filter((module) =>
            module.links.some(
              (link) => link.capability === selectedCapability.key,
            ),
          )}
        />
      ) : null}

      <ModuleMatrix
        modules={modules}
        capabilities={overview.capabilities}
        onSelect={setSelected}
        onFocusModule={setFocusedModule}
      />
    </>
  );
}

function countStatuses(
  overview: FoundationOverview,
): Record<FoundationStatus | 'undetermined', number> {
  const counts = { active: 0, needsSetup: 0, unused: 0, undetermined: 0 };
  for (const entry of overview.capabilities)
    counts[entry.status ?? 'undetermined'] += 1;
  return counts;
}

function LegendItem({
  status,
  label,
}: {
  readonly status: FoundationStatus;
  readonly label: string;
}): ReactElement {
  return (
    <li className='flex items-center gap-1.5'>
      <span
        aria-hidden
        className={cn(
          'size-3 rounded-full border',
          status === 'active' && 'border-primary/40 bg-primary/15',
          status === 'needsSetup' && 'border-amber-500/50 bg-amber-500/15',
          status === 'unused' && 'border-border bg-background',
        )}
      />
      {label}
    </li>
  );
}

function CapabilityBand({
  capabilities,
  active,
  lit,
  selected,
  onSelect,
  focusKeys,
}: {
  readonly capabilities: readonly FoundationCapability[];
  readonly active: readonly FoundationCapability[];
  readonly lit: number;
  readonly selected: FoundationCapabilityKey;
  readonly onSelect: (key: FoundationCapabilityKey) => void;
  readonly focusKeys?: ReadonlySet<string>;
}): ReactElement {
  const { t, text, locale } = useFoundationTranslation();
  const lighting = lit < active.length ? active[lit - 1]?.key : undefined;
  return (
    <ul className='grid grid-cols-3 border-t sm:grid-cols-5 lg:grid-cols-[repeat(auto-fit,minmax(88px,1fr))]'>
      {capabilities.map((capability) => {
        const Icon = CAPABILITY_ICONS[capability.key] ?? Plug;
        const order = active.findIndex((entry) => entry.key === capability.key);
        const isLit = order !== -1 && order < lit;
        const highlighted =
          capability.key === selected || capability.key === lighting;
        const look: 'lighting' | 'lit' | 'needsSetup' | 'off' | 'undetermined' =
          highlighted
            ? 'lighting'
            : capability.status === null
              ? capability.reason === 'unrecognizedExtension'
                ? 'off'
                : 'undetermined'
              : isLit
                ? 'lit'
                : capability.status === 'needsSetup'
                  ? 'needsSetup'
                  : 'off';
        const name = capability.title
          ? text(capability.title)
          : t(`capabilities.${capability.key}.name`);
        const status = t(
          capability.reason === 'unrecognizedExtension'
            ? 'dynamic.pending'
            : `status.${capability.status ?? 'undetermined'}`,
        );
        const statusLabel = capability.checkedAt
          ? `${status} · ${t('detail.retainedAt', { time: formatTime(capability.checkedAt, locale) })}`
          : status;
        return (
          <li
            key={capability.key}
            className={cn(
              '-mb-px -mr-px border-b border-r transition-opacity',
              focusKeys && !focusKeys.has(capability.key) && 'opacity-25',
            )}
          >
            <button
              type='button'
              onClick={() => onSelect(capability.key)}
              aria-pressed={capability.key === selected}
              aria-label={`${name}: ${statusLabel}`}
              title={statusLabel}
              data-status={capability.status ?? 'undetermined'}
              className={cn(
                'relative flex h-full min-h-20 w-full flex-col items-center justify-center gap-1.5 px-1 py-3 text-center text-xs transition-colors duration-300 motion-reduce:transition-none focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:text-sm',
                look === 'lighting' && 'bg-primary text-primary-foreground',
                look === 'lit' &&
                  'bg-primary/10 text-primary hover:bg-primary/15',
                look === 'needsSetup' &&
                  'bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400',
                look === 'off' &&
                  'bg-card text-muted-foreground hover:bg-hover',
                look === 'undetermined' &&
                  'bg-card text-muted-foreground hover:bg-hover',
                capability.key === selected &&
                  'z-10 ring-2 ring-inset ring-primary',
              )}
            >
              <Icon className='size-5' aria-hidden />
              <span className='max-w-full break-words leading-tight'>
                {name}
              </span>
              {capability.checkedAt ? (
                <RetainedAt
                  at={capability.checkedAt}
                  inheritColor={highlighted}
                />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Highlights({
  overview,
  onSelect,
}: {
  readonly overview: FoundationOverview;
  readonly onSelect: (key: FoundationCapabilityKey) => void;
}): ReactElement | null {
  const { t, locale } = useFoundationTranslation();
  const highlights = FOUNDATION_HIGHLIGHTS.filter(({ capability, metric }) =>
    overview.capabilities.some(
      (entry) =>
        entry.key === capability &&
        entry.metrics.some(
          (item) => item.key === metric && item.value !== null,
        ),
    ),
  );
  if (highlights.length === 0) return null;
  return (
    <section aria-label={t('page.highlightsLabel')}>
      <ul className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
        {highlights.map(({ capability: key, metric: metricKey }) => {
          const capability = overview.capabilities.find(
            (entry) => entry.key === key,
          );
          const metric = capability?.metrics.find(
            (entry) => entry.key === metricKey,
          );
          const value =
            metric === undefined
              ? undefined
              : formatMetricValue(metric, locale);
          return (
            <li key={`${key}.${metricKey}`}>
              <button
                type='button'
                onClick={() => onSelect(key)}
                className='flex h-full w-full flex-col items-start gap-1 rounded-xl border bg-card p-4 text-left hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <span
                  className={cn(
                    'font-heading text-2xl font-semibold tabular-nums',
                    value === undefined &&
                      'text-base font-normal text-muted-foreground',
                  )}
                  title={
                    metric && !metric.complete && metric.value !== null
                      ? t('page.partial')
                      : undefined
                  }
                >
                  {key === 'dataModeling'
                    ? t(
                        metricKey === 'businessCollections'
                          ? 'page.identified'
                          : 'page.counted',
                        { value },
                      )
                    : metric && !metric.complete
                      ? t('page.counted', { value })
                      : value}
                </span>
                <span className='text-sm text-muted-foreground'>
                  {t(`metrics.${metricKey}`)}
                </span>
                <span className='text-sm text-primary'>
                  {t(`capabilities.${key}.name`)}
                </span>
                {metric?.checkedAt ? (
                  <RetainedAt at={metric.checkedAt} />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RetainedAt({
  at,
  inheritColor = false,
}: {
  readonly at: string;
  readonly inheritColor?: boolean;
}): ReactElement {
  const { t, locale } = useFoundationTranslation();
  return (
    <span
      className={cn(
        'block text-xs font-normal',
        inheritColor ? 'text-current opacity-80' : 'text-muted-foreground',
      )}
    >
      {t('detail.retainedAt', { time: formatTime(at, locale) })}
    </span>
  );
}

function StatusBadge({
  status,
  pending = false,
}: {
  readonly status: FoundationStatus | null;
  readonly pending?: boolean;
}): ReactElement {
  const { t } = useFoundationTranslation();
  return (
    <span
      className={cn(
        'rounded-md border px-1.5 py-0.5 text-xs font-medium',
        status === 'active' && 'border-primary/30 bg-primary/10 text-primary',
        status === 'needsSetup' &&
          'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        status === 'unused' && 'text-muted-foreground',
        status === null && 'border-border text-muted-foreground',
      )}
    >
      {t(pending ? 'dynamic.pending' : `status.${status ?? 'undetermined'}`)}
    </span>
  );
}

function CapabilityDetail({
  capability,
  modules,
  inventory,
  counting,
  onCountRecords,
  recordCountCheckedAt,
}: {
  readonly capability: FoundationCapability;
  readonly modules: readonly FoundationBusinessModule[];
  readonly inventory?: FoundationProviderInventory;
  readonly counting: boolean;
  readonly onCountRecords?: () => void;
  readonly recordCountCheckedAt?: string;
}): ReactElement {
  const { t, word, text, locale } = useFoundationTranslation();
  const Icon = CAPABILITY_ICONS[capability.key] ?? Plug;
  const base = `capabilities.${capability.key}`;
  const relatedPackages = new Map(
    capability.packages.map((entry) => [entry.name, entry]),
  );
  for (const entry of inventory?.entries ?? []) {
    if (
      entry.categories.includes(capability.key) ||
      capability.key === `extension:${entry.name}`
    ) {
      const existing = relatedPackages.get(entry.name);
      relatedPackages.set(entry.name, {
        name: entry.name,
        version: existing?.version ?? entry.version,
      });
    }
  }
  const packages = [...relatedPackages.values()];
  const pending = capability.reason === 'unrecognizedExtension';
  const inUse = capability.status === 'active';
  const collectionSummary =
    capability.key === 'dataModeling'
      ? capability.facts.find(
          (fact) =>
            fact.code === 'applicationCollections' ||
            fact.code === 'applicationCollectionsPreview',
        )
      : undefined;
  const otherFacts = capability.facts.filter(
    (fact) =>
      fact !== collectionSummary && fact.code !== 'collectionOwnershipUnknown',
  );
  const ownershipNote = capability.facts.some(
    (fact) => fact.code === 'collectionOwnershipUnknown',
  );
  const visibleMetrics = capability.metrics.filter(
    (metric) => metric.value !== null,
  );
  const unreadable = capability.issues
    .filter((issue) => issue.code === 'SOURCE_UNREADABLE' && issue.source)
    .map((issue) => issue.source as string);

  return (
    <section
      id='foundation-capability-detail'
      aria-labelledby='foundation-capability-title'
      className='flex flex-col gap-5 rounded-xl border bg-card p-4 text-card-foreground md:p-5'
    >
      <header className='flex flex-col gap-1'>
        <h2
          id='foundation-capability-title'
          className='flex flex-wrap items-center gap-2 font-heading text-lg font-semibold'
        >
          <Icon className='size-5 text-primary' aria-hidden />
          {capability.title ? text(capability.title) : t(`${base}.name`)}{' '}
          <StatusBadge status={capability.status} pending={pending} />
        </h2>
        {capability.checkedAt ? <RetainedAt at={capability.checkedAt} /> : null}
        {!pending || capability.description ? (
          <p className='text-sm text-muted-foreground'>
            {pending ? capability.description : t(`${base}.tagline`)}
          </p>
        ) : null}
      </header>

      {pending ? (
        <p className='text-sm text-muted-foreground'>
          {t('dynamic.pendingDescription')}
        </p>
      ) : null}
      {ownershipNote ? (
        <details className='text-sm text-muted-foreground'>
          <summary>{t('inventory.recognitionNotes')}</summary>
          <p>{t('facts.collectionOwnershipUnknown')}</p>
        </details>
      ) : null}
      {capability.completeness !== 'complete' ? (
        <div
          role='note'
          className='flex gap-2 rounded-lg border p-3 text-sm text-muted-foreground'
        >
          <div className='flex flex-col gap-1'>
            <p>
              {t(
                capability.completeness === 'failed'
                  ? 'detail.failed'
                  : 'detail.partial',
              )}
            </p>
            <details key={capability.key}>
              <summary>{t('detail.readNotes')}</summary>
              {capability.issues.some(
                (issue) => issue.code === 'COLLECTOR_TIMEOUT',
              ) ? (
                <p className='text-muted-foreground'>{t('detail.timeout')}</p>
              ) : null}
              {unreadable.length > 0 ? (
                <p className='text-muted-foreground'>
                  {t('detail.unreadable', {
                    sources: new Intl.ListFormat(locale, {
                      style: 'short',
                    }).format(unreadable),
                  })}
                </p>
              ) : null}
            </details>
          </div>
        </div>
      ) : null}

      <div className='grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
        <div className='flex flex-col gap-4'>
          {capability.facts.length > 0 || inUse || modules.length > 0 ? (
            <div className='flex flex-col gap-2'>
              <h3 className='text-sm text-muted-foreground'>
                {t('detail.inThisApp')}
              </h3>
              {modules.length > 0 ? (
                <ul
                  aria-label={t('detail.businessModules')}
                  className='flex flex-wrap gap-1.5'
                >
                  {modules.map((module) => (
                    <li
                      key={module.id}
                      className='rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-xs text-primary'
                    >
                      {text(module.title)}
                    </li>
                  ))}
                </ul>
              ) : null}
              {collectionSummary ? (
                <CollectionsBrowser summary={collectionSummary} />
              ) : null}
              {otherFacts.length > 0 ? (
                <ul className='flex list-disc flex-col gap-1.5 pl-5 text-sm marker:text-primary'>
                  {otherFacts.map((fact) => (
                    <li key={fact.code}>
                      {word(
                        `facts.${fact.code}`,
                        formatFactParams(fact.params, locale, text),
                      )}
                      {fact.checkedAt ? (
                        <RetainedAt at={fact.checkedAt} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : !collectionSummary ? (
                <p className='text-sm text-muted-foreground'>
                  {t(
                    capability.checkedAt
                      ? 'page.unavailable'
                      : 'detail.noFacts',
                  )}
                </p>
              ) : null}
            </div>
          ) : null}

          {!inUse && !pending && capability.reason ? (
            <div className='flex flex-col gap-2'>
              <h3 className='text-sm text-muted-foreground'>
                {t('detail.whyNot')}
              </h3>
              <p className='text-sm'>{word(`reasons.${capability.reason}`)}</p>
            </div>
          ) : null}

          {capability.parts.length > 0 ? (
            <div className='flex flex-col gap-2'>
              <h3 className='text-sm text-muted-foreground'>
                {t('detail.parts')}
              </h3>
              <ul className='flex flex-col gap-1.5 text-sm'>
                {capability.parts.map((part) => (
                  <li
                    key={part.key}
                    className='flex flex-wrap items-center gap-2'
                  >
                    <span>{word(`parts.${part.key}`)}</span>
                    <StatusBadge status={part.status} />
                    {part.checkedAt ? <RetainedAt at={part.checkedAt} /> : null}
                    {part.reason && part.status !== 'active' ? (
                      <span className='text-muted-foreground'>
                        {word(`reasons.${part.reason}`)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {!pending && capability.status !== null ? (
            <div className='rounded-lg border border-dashed p-3'>
              <h3 className='text-sm text-muted-foreground'>
                {t(inUse ? 'detail.withoutFoundation' : 'detail.onceInUse')}
              </h3>
              <p className='mt-1 text-sm'>
                {t(inUse ? `${base}.without` : `${base}.onceInUse`)}
              </p>
            </div>
          ) : null}
        </div>

        <div className='flex flex-col gap-4'>
          {visibleMetrics.length > 0 ? (
            <div className='flex flex-col gap-2'>
              <h3 className='text-sm text-muted-foreground'>
                {t('detail.liveData')}
              </h3>
              <ul className='grid grid-cols-2 gap-2'>
                {visibleMetrics.map((metric) => {
                  const value = formatMetricValue(metric, locale);
                  return (
                    <li key={metric.key} className='rounded-lg bg-muted p-3'>
                      <p
                        className={cn(
                          'font-heading text-xl font-semibold tabular-nums',
                          value === undefined &&
                            'text-sm font-normal text-muted-foreground',
                        )}
                        title={!metric.complete ? t('page.partial') : undefined}
                      >
                        {capability.key === 'dataModeling'
                          ? t(
                              [
                                'businessCollections',
                                'views',
                                'systemCollections',
                              ].includes(metric.key)
                                ? 'page.identified'
                                : 'page.counted',
                              { value },
                            )
                          : !metric.complete
                            ? t('page.counted', { value })
                            : value}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {word(`metrics.${metric.key}`)}
                      </p>
                      {metric.checkedAt ? (
                        <RetainedAt at={metric.checkedAt} />
                      ) : !metric.complete &&
                        value !== undefined &&
                        capability.key === 'files' ? (
                        <p className='text-xs text-muted-foreground'>
                          {t('page.partial')}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {capability.key === 'dataModeling' ? (
                <div className='flex flex-col items-start gap-1'>
                  {onCountRecords ? (
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={counting}
                      onClick={onCountRecords}
                    >
                      {t(counting ? 'page.refreshing' : 'detail.countRecords')}
                    </Button>
                  ) : null}
                  <p className='text-xs text-muted-foreground'>
                    {recordCountCheckedAt
                      ? t('detail.recordsCountedAt', {
                          time: formatTime(recordCountCheckedAt, locale),
                        })
                      : t('detail.recordsOnDemand')}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className='flex flex-col gap-2'>
            <h3 className='text-sm text-muted-foreground'>
              {t('detail.packages')}
            </h3>
            {packages.length > 0 ? (
              <ul className='flex flex-col gap-1 font-mono text-xs'>
                {packages.map((entry) => (
                  <li
                    key={entry.name}
                    className='flex items-center justify-between gap-3'
                  >
                    <span className='flex min-w-0 items-center gap-1.5'>
                      <Package
                        className='size-3.5 shrink-0 text-muted-foreground'
                        aria-hidden
                      />
                      <span className='truncate'>{entry.name}</span>
                    </span>
                    <span className='shrink-0 text-muted-foreground'>
                      {entry.version ?? t('page.unavailable')}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm text-muted-foreground'>
                {t(
                  capability.completeness === 'failed'
                    ? 'page.unavailable'
                    : 'detail.noPackages',
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FoundationPage;
