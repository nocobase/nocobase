import { useClientApplication } from '@nocobase/app-client';
import { cn } from 'cn';
import {
  ChevronRight,
  Layers,
  Package,
  Plug,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';

import {
  FOUNDATION_HIGHLIGHTS,
  type FoundationCapability,
  type FoundationBusinessModule,
  type FoundationCapabilityKey,
  type FoundationOverview,
  type FoundationProviderEntry,
  type FoundationProviderInventory,
  type FoundationStatus,
} from '../../shared/foundation.js';
import { withAvailableCapabilities } from '../../shared/available-capabilities.js';
import { businessModules } from '../business-modules.js';
import { Button } from './ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';
import { ModuleMatrix } from './module-matrix.js';
import { useFoundationTranslation } from './foundation-translation.js';

import { useFoundationOverview } from '../api.js';
import {
  clientProviderNames,
  withClientProviders,
} from '../provider-inventory.js';
import { CAPABILITY_ICONS } from './capability-icons.js';
import { formatFactParams, formatMetricValue, formatTime } from './format.js';

/** How long each capability takes to light up. */
const LIGHT_STEP_MS = 140;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Lights the active capabilities one after another when an overview arrives. With reduced motion everything is lit
 * at once.
 */
function useLighting(
  activeCount: number,
  runKey: string,
): { readonly lit: number } {
  const reduced = prefersReducedMotion();
  const [state, setState] = useState({ runKey, step: 0 });
  // A new result lights up from the start again: adjusting state while rendering, as React recommends over an effect.
  if (state.runKey !== runKey) setState({ runKey, step: 0 });
  useEffect(() => {
    if (reduced || activeCount === 0) return undefined;
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setState((current) => ({ ...current, step }));
      if (step >= activeCount) clearInterval(timer);
    }, LIGHT_STEP_MS);
    return () => clearInterval(timer);
  }, [activeCount, runKey, reduced]);
  return {
    lit: reduced ? activeCount : Math.min(state.step, activeCount),
  };
}

export function FoundationPage(): ReactElement {
  const { t } = useFoundationTranslation();
  const app = useClientApplication();
  const { overview, error, loading, refresh } = useFoundationOverview();

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
              className='rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-foreground'
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
        <p className='rounded-lg border bg-card p-6 text-sm text-muted-foreground'>
          {t('page.loading')}
        </p>
      )}
    </div>
  );
}

export interface FoundationOverviewViewProps {
  readonly overview: FoundationOverview;
  readonly refreshing?: boolean;
  readonly onRefresh?: () => void;
  readonly clientProviders?: readonly string[];
  readonly registeredRoutes?: Parameters<typeof businessModules>[0];
}

/** The band, the key numbers and the selected capability's details, for a page that loads the overview itself. */
export function FoundationOverviewView({
  overview: serverOverview,
  refreshing = false,
  onRefresh,
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
  const { lit } = useLighting(active.length, overview.checkedAt);
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
              <li className='flex items-center gap-1.5 text-foreground'>
                <TriangleAlert
                  className='size-3.5 text-destructive'
                  aria-hidden
                />
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

function RecognitionNotes({
  inventory,
  selected,
}: {
  readonly inventory: FoundationProviderInventory;
  readonly selected: FoundationCapabilityKey;
}): ReactElement {
  const { t } = useFoundationTranslation();
  const selectedProviders = inventory.entries.filter(
    (entry) =>
      entry.categories.includes(selected) ||
      selected === `extension:${entry.name}`,
  );
  const extensions = inventory.entries.filter(
    (entry) => entry.categories.length === 0,
  );
  const mapped = inventory.entries.length - extensions.length;
  return (
    <Collapsible className='border-t pt-4'>
      <CollapsibleTrigger className='group inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
        <ChevronRight
          className='size-4 transition-transform group-data-[panel-open]:rotate-90 motion-reduce:transition-none'
          aria-hidden
        />
        {t('inventory.recognitionNotes')}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {!inventory.complete ? (
          <p role='status' className='pt-3 text-sm text-destructive'>
            {t('inventory.partial', {
              sources: inventory.unreadable.join(', '),
            })}
          </p>
        ) : null}
        <dl className='flex flex-wrap gap-x-6 gap-y-2 pt-3 text-xs'>
          {[
            ['discovered', inventory.entries.length],
            ['mapped', mapped],
            ['unmapped', extensions.length],
          ].map(([key, count]) => (
            <div key={key} className='flex items-baseline gap-2'>
              <dt className='text-xs text-muted-foreground'>
                {t(`inventory.${key}`)}
              </dt>
              <dd className='font-medium tabular-nums'>{count}</dd>
            </div>
          ))}
        </dl>
        <p className='py-3 text-xs leading-relaxed text-muted-foreground'>
          {t('inventory.discoveryBoundary')}
        </p>
        {selectedProviders.length > 0 ? (
          <ul className='min-w-0 divide-y'>
            {selectedProviders.map((entry) => (
              <ProviderCard key={entry.name} entry={entry} showEvidence />
            ))}
          </ul>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ProviderCard({
  entry,
  showEvidence = false,
}: {
  readonly entry: FoundationProviderEntry;
  readonly showEvidence?: boolean;
}): ReactElement {
  const { t } = useFoundationTranslation();
  return (
    <li className='grid min-w-0 gap-3 py-4 first:pt-1 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'>
      <div className='flex min-w-0 items-start gap-2'>
        <Package
          className='mt-0.5 size-4 shrink-0 text-muted-foreground'
          aria-hidden
        />
        <div className='min-w-0'>
          <p className='break-all font-mono text-xs font-medium'>
            {entry.name}
          </p>
          <p className='mt-1 break-all text-xs text-muted-foreground'>
            {entry.version ?? t('inventory.versionUnknown')}
          </p>
        </div>
      </div>
      {showEvidence ? (
        <dl className='grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs leading-relaxed'>
          <dt className='text-muted-foreground'>{t('inventory.origin')}</dt>
          <dd>
            {t(
              `inventory.${entry.origin === 'nocobase' ? 'officialCatalog' : 'unverifiedOrigin'}`,
            )}
          </dd>
          <dt className='text-muted-foreground'>
            {t('inventory.installation')}
          </dt>
          <dd>
            {t(
              entry.installed
                ? 'inventory.installed'
                : 'inventory.manifestUnavailable',
            )}
          </dd>
          {entry.kind === 'plugin' ? (
            <>
              <dt className='text-muted-foreground'>
                {t('inventory.registration')}
              </dt>
              <dd>
                {t(
                  entry.registration === 'observed'
                    ? 'inventory.observed'
                    : 'inventory.registrationUnknown',
                )}
              </dd>
            </>
          ) : null}
          <dt className='text-muted-foreground'>{t('inventory.evidence')}</dt>
          <dd>
            {entry.evidence.length
              ? entry.evidence
                  .map((evidence) => t(`inventory.evidenceLabels.${evidence}`))
                  .join(' · ')
              : t('inventory.noEvidence')}
          </dd>
          <dt className='text-muted-foreground'>{t('inventory.categories')}</dt>
          <dd>
            {entry.categories.length
              ? entry.categories
                  .map((category) => t(`capabilities.${category}.name`))
                  .join(' · ')
              : t('inventory.awaitingRecognition')}
          </dd>
        </dl>
      ) : null}
    </li>
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
  const { t, text } = useFoundationTranslation();
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
              aria-label={`${name}: ${status}`}
              title={status}
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
                  'bg-card text-muted-foreground outline-1 -outline-offset-4 outline-dashed outline-destructive/40 hover:bg-hover',
                capability.key === selected &&
                  'z-10 ring-2 ring-inset ring-primary',
              )}
            >
              <Icon className='size-5' aria-hidden />
              <span className='max-w-full break-words leading-tight'>
                {name}
              </span>
              {capability.status === null &&
              capability.reason !== 'unrecognizedExtension' ? (
                <TriangleAlert
                  className='absolute right-1.5 top-1.5 size-3.5 text-destructive'
                  aria-hidden
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
}): ReactElement {
  const { t, locale } = useFoundationTranslation();
  return (
    <section aria-label={t('page.highlightsLabel')}>
      <ul className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'>
        {FOUNDATION_HIGHLIGHTS.filter(({ capability }) =>
          overview.capabilities.some((entry) => entry.key === capability),
        ).map(({ capability: key, metric: metricKey }) => {
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
                      ? t('page.lowerBound')
                      : undefined
                  }
                >
                  {value === undefined
                    ? capability?.status === 'unused' ||
                      capability?.status === 'needsSetup'
                      ? t(`status.${capability.status}`)
                      : t('page.unavailable')
                    : metric && !metric.complete
                      ? `≥ ${value}`
                      : value}
                </span>
                <span className='text-sm text-muted-foreground'>
                  {t(`metrics.${metricKey}`)}
                </span>
                <span className='text-sm text-primary'>
                  {t(`capabilities.${key}.name`)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
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
        status === null &&
          (pending
            ? 'border-border text-muted-foreground'
            : 'border-destructive/40 text-destructive'),
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
}: {
  readonly capability: FoundationCapability;
  readonly modules: readonly FoundationBusinessModule[];
  readonly inventory?: FoundationProviderInventory;
}): ReactElement {
  const { t, word, text, locale } = useFoundationTranslation();
  const Icon = CAPABILITY_ICONS[capability.key] ?? Plug;
  const base = `capabilities.${capability.key}`;
  const pending = capability.reason === 'unrecognizedExtension';
  const inUse = capability.status === 'active';
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
      {capability.completeness !== 'complete' ? (
        <div
          role='note'
          className='flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm'
        >
          <TriangleAlert
            className='mt-0.5 size-4 shrink-0 text-destructive'
            aria-hidden
          />
          <div className='flex flex-col gap-1'>
            <p>
              {t(
                capability.completeness === 'failed'
                  ? 'detail.failed'
                  : 'detail.partial',
              )}
            </p>
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
              {capability.facts.length > 0 ? (
                <ul className='flex list-disc flex-col gap-1.5 pl-5 text-sm marker:text-primary'>
                  {capability.facts.map((fact) => (
                    <li key={fact.code}>
                      {word(
                        `facts.${fact.code}`,
                        formatFactParams(fact.params, locale, text),
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {t('detail.noFacts')}
                </p>
              )}
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

          {!pending ? (
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
          {capability.metrics.length > 0 ? (
            <div className='flex flex-col gap-2'>
              <h3 className='text-sm text-muted-foreground'>
                {t('detail.liveData')}
              </h3>
              <ul className='grid grid-cols-2 gap-2'>
                {capability.metrics.map((metric) => {
                  const value = formatMetricValue(metric, locale);
                  return (
                    <li key={metric.key} className='rounded-lg bg-muted p-3'>
                      <p
                        className={cn(
                          'font-heading text-xl font-semibold tabular-nums',
                          value === undefined &&
                            'text-sm font-normal text-muted-foreground',
                        )}
                        title={
                          !metric.complete && value !== undefined
                            ? t('page.lowerBound')
                            : undefined
                        }
                      >
                        {value === undefined
                          ? t('page.unavailable')
                          : metric.complete
                            ? value
                            : `≥ ${value}`}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {word(`metrics.${metric.key}`)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className='flex flex-col gap-2'>
            <h3 className='text-sm text-muted-foreground'>
              {t('detail.packages')}
            </h3>
            {capability.packages.length > 0 ? (
              <ul className='flex flex-col gap-1 font-mono text-xs'>
                {capability.packages.map((entry) => (
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
                {t('detail.noPackages')}
              </p>
            )}
          </div>
        </div>
      </div>
      {inventory ? (
        <RecognitionNotes
          key={capability.key}
          inventory={inventory}
          selected={capability.key}
        />
      ) : null}
    </section>
  );
}

export default FoundationPage;
