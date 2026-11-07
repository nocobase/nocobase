import { useClientApplication } from '@nocobase/app-client';
import { cn } from 'cn';
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Circle,
  Layers,
  Package,
  Plug,
  RefreshCw,
} from 'lucide-react';
import {
  Fragment,
  useCallback,
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
  type FoundationProviderInventory,
  type FoundationStatus,
} from '../../shared/foundation.js';
import { withAvailableCapabilities } from '../../shared/available-capabilities.js';
import { businessModules } from '../business-modules.js';
import { Button } from './ui/button.js';
import { Skeleton } from './ui/skeleton.js';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './ui/collapsible.js';
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
  const { overview, scan, error, loading, refresh, countRecords } =
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
          {loading ? (
            <p role='status' className='text-sm text-muted-foreground'>
              {t('page.updatingHistory')}
            </p>
          ) : null}
          {scan?.snapshotKernelVersion &&
          scan.snapshotKernelVersion !== scan.kernelVersion ? (
            <p className='text-sm text-muted-foreground'>
              {t('page.previousKernel', {
                version: scan.snapshotKernelVersion,
                current: scan.kernelVersion,
              })}
            </p>
          ) : null}
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
            <Button
              variant='outline'
              type='button'
              onClick={refresh}
              className='rounded-md border border-input px-3 py-1.5 hover:bg-hover'
            >
              {t('page.retry')}
            </Button>
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
        <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-4 md:px-5 md:pt-5'>
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
          <div className='flex flex-wrap items-end gap-x-4 gap-y-2'>
            <p className='flex flex-wrap items-baseline gap-x-2'>
              <span
                className='font-heading text-3xl font-semibold tabular-nums'
                aria-live='polite'
              >
                {t('page.score', {
                  active: Math.min(lit, active.length),
                  total: overview.capabilities.length,
                })}
              </span>
              <span className='text-sm text-muted-foreground'>
                {t('page.scoreCaption')}
              </span>
            </p>
            <div className='flex flex-col items-start gap-1 sm:items-end'>
              {onRefresh ? (
                <Button
                  variant='outline'
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
                </Button>
              ) : null}
              <span className='text-xs text-muted-foreground'>
                {t('page.updatedAt', {
                  time: formatTime(overview.checkedAt, locale),
                })}
              </span>
            </div>
          </div>
        </div>
        <ul className='flex flex-wrap gap-2 px-4 pt-3 md:px-5'>
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
            <LegendItem
              status={null}
              label={t('page.undetermined', { count: counts.undetermined })}
            />
          ) : null}
        </ul>
        <CapabilityBand
          capabilities={overview.capabilities}
          selected={selected}
          onSelect={select}
          focusKeys={focusKeys}
        />
        {modules.length ? (
          <div
            aria-label={t('matrix.modules')}
            className='flex flex-col gap-2.5 border-t px-4 py-3.5 md:px-5'
          >
            <span className='text-sm font-medium'>{t('matrix.modules')}</span>
            <div className='flex flex-wrap items-center gap-2'>
              {modules.map((module) => (
                <Button
                  key={module.id}
                  variant='outline'
                  size='xs'
                  aria-pressed={module.id === focusedModule}
                  className={cn(
                    'h-7! gap-1.5 rounded-full! border-border bg-card pr-1.5 pl-3 text-sm font-normal shadow-none',
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
                  <span className='min-w-5 rounded-full bg-muted px-1.5 text-center text-xs leading-5 tabular-nums text-muted-foreground'>
                    {module.links.length}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        ) : null}
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
  readonly status: FoundationStatus | null;
  readonly label: string;
}): ReactElement {
  return (
    <li>
      <StatusBadge status={status} label={label} />
    </li>
  );
}

/** Long package-style names may break after a hyphen, never inside a word. */
function breakableName(name: string): ReactElement {
  const parts: { readonly at: number; readonly text: string }[] = [];
  for (const match of name.matchAll(/[^-]*-|[^-]+$/g))
    parts.push({ at: match.index, text: match[0] });
  return (
    <>
      {parts.map((part) => (
        <Fragment key={part.at}>
          {part.at > 0 ? <wbr /> : null}
          {part.text}
        </Fragment>
      ))}
    </>
  );
}

function CapabilityBand({
  capabilities,
  selected,
  onSelect,
  focusKeys,
}: {
  readonly capabilities: readonly FoundationCapability[];
  readonly selected: FoundationCapabilityKey;
  readonly onSelect: (key: FoundationCapabilityKey) => void;
  readonly focusKeys?: ReadonlySet<string>;
}): ReactElement {
  const { t, text, locale } = useFoundationTranslation();
  return (
    <ul className='mx-4 mt-3 mb-4 flex flex-col overflow-hidden rounded-lg border sm:mx-5 sm:mb-5 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] sm:gap-2 sm:overflow-visible sm:rounded-none sm:border-0'>
      {capabilities.map((capability) => {
        const Icon = CAPABILITY_ICONS[capability.key] ?? Plug;
        const isSelected = capability.key === selected;
        const extension = capability.key.startsWith('extension:');
        const identifier = extension
          ? capability.key.slice('extension:'.length)
          : undefined;
        const title = capability.title
          ? text(capability.title)
          : t(`capabilities.${capability.key}.name`);
        // Without a display name an extension is titled by its package; drop the scope for reading, keep it in the title.
        const name =
          identifier && title === identifier
            ? identifier.replace(/^@[^/]+\//, '')
            : title;
        const pending = capability.reason === 'unrecognizedExtension';
        const status = t(
          pending
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
              'border-t first:border-t-0 sm:border-t-0 transition-opacity motion-reduce:transition-none',
              focusKeys && !focusKeys.has(capability.key) && 'opacity-40',
            )}
          >
            <Button
              variant='ghost'
              type='button'
              onClick={() => onSelect(capability.key)}
              aria-pressed={isSelected}
              aria-label={`${title}: ${statusLabel}`}
              title={
                identifier ? `${identifier} · ${statusLabel}` : statusLabel
              }
              data-status={capability.status ?? 'undetermined'}
              className={cn(
                'relative flex h-full w-full items-center justify-between gap-3 rounded-none border-0 bg-card px-3 py-2.5 text-left font-normal whitespace-normal hover:bg-hover active:not-aria-[haspopup]:translate-y-0',
                'sm:flex-col sm:items-stretch sm:gap-2.5 sm:rounded-lg sm:border sm:border-border sm:pb-3',
                'focus-visible:z-10 focus-visible:border-border focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring sm:focus-visible:outline-offset-2',
                isSelected &&
                  'shadow-[inset_4px_0_0_var(--primary)] sm:border-primary sm:shadow-[inset_0_0_0_1px_var(--primary)] sm:focus-visible:border-primary',
              )}
            >
              {isSelected ? (
                <span
                  aria-hidden
                  className='absolute top-2 right-2 hidden size-3.5 rounded-full border-2 border-primary bg-card after:absolute after:inset-0.5 after:rounded-full after:bg-primary sm:block'
                />
              ) : null}
              <span className='flex min-w-0 flex-1 items-center gap-2.5 sm:min-h-10 sm:flex-none sm:items-start sm:pr-3'>
                <span
                  className={cn(
                    'grid size-8 shrink-0 place-items-center rounded-md bg-muted text-foreground',
                    isSelected && 'bg-primary text-primary-foreground',
                  )}
                >
                  <Icon className='size-4' aria-hidden />
                </span>
                <span className='flex min-w-0 flex-col gap-0.5'>
                  <span className='text-sm leading-tight font-medium text-balance wrap-normal'>
                    {identifier ? breakableName(name) : name}
                  </span>
                  {extension ? (
                    <span className='text-xs text-muted-foreground'>
                      {t('dynamic.extension')}
                    </span>
                  ) : null}
                  {capability.checkedAt ? (
                    <RetainedAt at={capability.checkedAt} />
                  ) : null}
                </span>
              </span>
              <StatusBadge
                status={capability.status}
                pending={pending}
                className='max-w-[46%] shrink-0 sm:max-w-full'
              />
            </Button>
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
        (capability === 'dataModeling' ||
          entry.metrics.some(
            (item) => item.key === metric && item.value !== null,
          )),
    ),
  );
  if (highlights.length === 0) return null;
  // Data modeling contributes most of the key numbers, so it is its own group; the rest share one group.
  const groups = [
    {
      capability: 'dataModeling' as FoundationCapabilityKey | undefined,
      items: highlights.filter((item) => item.capability === 'dataModeling'),
    },
    {
      capability: undefined,
      items: highlights.filter((item) => item.capability !== 'dataModeling'),
    },
  ].filter((group) => group.items.length > 0);
  return (
    <section
      aria-labelledby='foundation-highlights-title'
      className='flex flex-col gap-3.5 rounded-xl border bg-card p-4 text-card-foreground md:p-5'
    >
      <h2
        id='foundation-highlights-title'
        className='font-heading text-base font-medium'
      >
        {t('page.highlightsLabel')}
      </h2>
      {groups.map((group) => (
        <div
          key={group.capability ?? 'other'}
          className='flex flex-col gap-2 border-t pt-3.5 first-of-type:border-t-0 first-of-type:pt-0'
        >
          {group.capability ? (
            <Button
              variant='link'
              type='button'
              onClick={() => onSelect(group.capability!)}
              className='h-auto w-fit gap-1 p-0 text-xs font-medium text-muted-foreground'
            >
              {t(`capabilities.${group.capability}.name`)}
              <ChevronRight className='size-3.5' aria-hidden />
            </Button>
          ) : (
            <h3 className='text-xs font-medium text-muted-foreground'>
              {t('page.otherCapabilities')}
            </h3>
          )}
          <ul className='flex flex-col sm:grid sm:grid-cols-3 sm:gap-2 xl:grid-cols-6'>
            {group.items.map(({ capability: key, metric: metricKey }) => {
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
                <li
                  key={`${key}.${metricKey}`}
                  className='border-t first:border-t-0 sm:border-t-0'
                >
                  <Button
                    variant='ghost'
                    type='button'
                    onClick={() => onSelect(key)}
                    className='flex h-full w-full items-center justify-between gap-3 rounded-none px-0 py-2 text-left font-normal whitespace-normal hover:bg-hover active:not-aria-[haspopup]:translate-y-0 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring sm:flex-col sm:items-stretch sm:gap-1.5 sm:rounded-lg sm:bg-muted/70 sm:px-3 sm:py-2.5'
                  >
                    <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                      <span className='text-sm text-muted-foreground text-pretty'>
                        {t(`metrics.${metricKey}`)}
                      </span>
                      {group.capability ? null : (
                        <span className='text-xs text-muted-foreground/85'>
                          {t(`capabilities.${key}.name`)}
                        </span>
                      )}
                      {metric && !metric.complete && metric.value !== null ? (
                        <span className='text-xs text-muted-foreground'>
                          {t('page.lowerBound')}
                        </span>
                      ) : null}
                      {metric?.checkedAt ? (
                        <RetainedAt at={metric.checkedAt} />
                      ) : null}
                    </span>
                    {value !== undefined ? (
                      <span className='shrink-0 font-heading text-lg font-semibold tabular-nums sm:text-2xl'>
                        {value}
                      </span>
                    ) : (
                      <span className='flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground sm:leading-8'>
                        <CircleDashed className='size-3.5' aria-hidden />
                        {t(
                          metricKey === 'businessRecords' &&
                            !overview.recordCountCheckedAt
                            ? 'page.notCounted'
                            : 'page.unavailable',
                        )}
                      </span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
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

const STATUS_ICONS = {
  active: CircleCheck,
  needsSetup: CircleAlert,
  unused: Circle,
  undetermined: CircleDashed,
} as const;

/**
 * A status is a badge with its own surface, border, icon and words, so it never depends on color alone. In use follows
 * the theme's primary color; selection is shown on the tile itself, never by a badge.
 */
function StatusBadge({
  status,
  pending = false,
  label,
  className,
}: {
  readonly status: FoundationStatus | null;
  readonly pending?: boolean;
  readonly label?: string;
  readonly className?: string;
}): ReactElement {
  const { t } = useFoundationTranslation();
  const tone = status ?? 'undetermined';
  const Icon = STATUS_ICONS[tone];
  return (
    <span
      className={cn(
        'inline-flex w-fit max-w-full items-start gap-1 rounded-md border px-2 py-0.5 text-left text-xs leading-4 font-medium',
        tone === 'active' &&
          'border-primary/45 bg-primary/8 font-semibold text-primary [&>svg_circle]:fill-current [&>svg_path]:stroke-card',
        tone === 'needsSetup' &&
          'border-[color-mix(in_srgb,var(--status-warning,var(--color-amber-700))_45%,transparent)] bg-card text-[var(--status-warning,var(--color-amber-700))] dark:border-[color-mix(in_srgb,var(--status-warning,var(--color-amber-400))_45%,transparent)] dark:text-[var(--status-warning,var(--color-amber-400))]',
        tone === 'unused' &&
          'border-transparent bg-muted font-normal text-muted-foreground',
        tone === 'undetermined' &&
          'border-dashed border-input font-normal text-muted-foreground',
        className,
      )}
    >
      <Icon className='mt-px size-3.5 shrink-0' aria-hidden />
      <span>
        {label ??
          t(pending ? 'dynamic.pending' : `status.${status ?? 'undetermined'}`)}
      </span>
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
        <p className='text-xs text-muted-foreground'>
          {t('detail.selectedCapability')}
        </p>
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
        <Collapsible className='text-sm text-muted-foreground'>
          <CollapsibleTrigger
            render={
              <Button
                variant='link'
                className='h-auto p-0 text-muted-foreground'
              />
            }
          >
            {t('inventory.recognitionNotes')}
          </CollapsibleTrigger>
          <CollapsibleContent keepMounted>
            <p>{t('facts.collectionOwnershipUnknown')}</p>
          </CollapsibleContent>
        </Collapsible>
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
            <Collapsible key={capability.key}>
              <CollapsibleTrigger
                render={
                  <Button
                    variant='link'
                    className='h-auto p-0 text-muted-foreground'
                  />
                }
              >
                {t('detail.readNotes')}
              </CollapsibleTrigger>
              <CollapsibleContent keepMounted>
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
              </CollapsibleContent>
            </Collapsible>
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
                      <p className='flex flex-wrap items-baseline gap-x-2 text-sm'>
                        <span className='text-muted-foreground'>
                          {word(`metrics.${metric.key}`)}
                        </span>{' '}
                        <span className='font-semibold tabular-nums'>
                          {value ?? t('page.unavailable')}
                        </span>
                      </p>
                      {metric.checkedAt ? (
                        <RetainedAt at={metric.checkedAt} />
                      ) : !metric.complete && value !== undefined ? (
                        <p className='text-xs text-muted-foreground'>
                          {t('page.lowerBound')}
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
