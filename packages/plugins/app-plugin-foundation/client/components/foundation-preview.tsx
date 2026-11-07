import { useClientApplication } from '@nocobase/app-client';
import { useMemo, useState, type ReactElement } from 'react';
import { useNavigate, useParams, useResolvedPath } from 'react-router';
import {
  ArrowUpRight,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleDashed,
  CircleAlert,
  Layers,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { cn } from 'cn';
import type {
  FoundationCapability,
  FoundationOverview,
  FoundationStatus,
} from '../../shared/foundation.js';
import { withAvailableCapabilities } from '../../shared/available-capabilities.js';
import { useFoundationOverview } from '../api.js';
import { businessModules } from '../business-modules.js';
import {
  clientProviderNames,
  withClientProviders,
} from '../provider-inventory.js';
import { useFoundationTranslation } from './foundation-translation.js';
import { CAPABILITY_ICONS } from './capability-icons.js';
import { formatFactParams, formatMetricValue, formatTime } from './format.js';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog.js';

const GROUPS = [
  { key: 'data', capabilities: ['dataModeling', 'files'] },
  { key: 'people', capabilities: ['usersAndOrganizations', 'permissions'] },
  { key: 'process', capabilities: ['workflows', 'notifications', 'mail'] },
  { key: 'intelligence', capabilities: ['aiAgents', 'knowledge'] },
  { key: 'platform', capabilities: ['interface', 'operations'] },
  { key: 'integration', capabilities: ['integrations', 'audit'] },
] as const;
const KNOWN = new Set<string>(
  GROUPS.flatMap((group) => [...group.capabilities]),
);

function State({
  value,
}: {
  readonly value: FoundationStatus | null;
}): ReactElement {
  const { t } = useFoundationTranslation();
  const Icon =
    value === 'active'
      ? CircleCheck
      : value === 'needsSetup'
        ? CircleAlert
        : value === 'unused'
          ? Circle
          : CircleDashed;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 text-xs',
        value === 'active' ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className='size-3.5' aria-hidden />
      {t(`status.${value ?? 'undetermined'}`)}
    </span>
  );
}

function Fold({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): ReactElement {
  return (
    <Collapsible className='border-t'>
      <CollapsibleTrigger
        render={
          <Button
            variant='ghost'
            className='group h-auto w-full justify-between rounded-none px-0 py-4 text-left whitespace-normal hover:bg-transparent'
          />
        }
      >
        <span>{title}</span>
        <ChevronRight
          aria-hidden
          className='size-4 shrink-0 transition-transform group-aria-expanded:rotate-90 motion-reduce:transition-none'
        />
      </CollapsibleTrigger>
      <CollapsibleContent className='pb-5'>{children}</CollapsibleContent>
    </Collapsible>
  );
}

export default function FoundationPreview(): ReactElement {
  const app = useClientApplication();
  const state = useFoundationOverview();
  const providers = clientProviderNames(app);
  const overview = useMemo(
    () =>
      state.overview?.inventory
        ? withAvailableCapabilities(
            state.overview,
            withClientProviders(state.overview.inventory, providers),
          )
        : state.overview,
    [state.overview, providers],
  );
  const { t } = useFoundationTranslation();
  if (state.error === 'forbidden' || !overview) {
    return (
      <div className='mx-auto w-full max-w-6xl p-6'>
        <h1 className='text-2xl font-semibold'>{t('page.title')}</h1>
        <p
          className='mt-6 text-muted-foreground'
          role={state.error ? 'alert' : 'status'}
        >
          {t(
            state.error === 'forbidden'
              ? 'page.forbidden'
              : state.error
                ? 'page.loadFailed'
                : 'page.loading',
          )}
        </p>
        {state.error === 'failed' ? (
          <Button variant='outline' className='mt-4' onClick={state.refresh}>
            {t('page.retry')}
          </Button>
        ) : null}
      </div>
    );
  }
  return (
    <FoundationPreviewView
      overview={overview}
      refreshing={state.loading}
      refresh={state.refresh}
      failed={state.error === 'failed'}
    />
  );
}

export function FoundationPreviewView({
  overview,
  refreshing = false,
  refresh,
  failed = false,
}: {
  readonly overview: FoundationOverview;
  readonly refreshing?: boolean;
  readonly refresh?: () => void;
  readonly failed?: boolean;
}): ReactElement {
  const { t, text, word, locale } = useFoundationTranslation();
  const app = useClientApplication();
  const navigate = useNavigate();
  const { capability: selectedKey } = useParams();
  const route = useResolvedPath('.');
  const basePath = selectedKey
    ? route.pathname.slice(0, route.pathname.lastIndexOf('/'))
    : route.pathname.replace(/\/$/, '');
  const [query, setQuery] = useState('');
  const capabilities = overview.availableCapabilities ?? overview.capabilities;
  const selected = capabilities.find((entry) => entry.key === selectedKey);
  const name = (entry: FoundationCapability): string =>
    entry.title ? text(entry.title) : t(`capabilities.${entry.key}.name`);
  const description = (entry: FoundationCapability): string =>
    KNOWN.has(entry.key)
      ? t(`capabilities.${entry.key}.tagline`)
      : (entry.description ?? t('dynamic.pendingDescription'));
  const matches = (entry: FoundationCapability): boolean =>
    `${name(entry)} ${entry.key}`
      .toLocaleLowerCase(locale)
      .includes(query.trim().toLocaleLowerCase(locale));
  const modules = useMemo(
    () =>
      businessModules(
        app.runtime.routes,
        overview.inventory,
        overview.moduleSources,
        capabilities.map((entry) => entry.key),
      ),
    [app.runtime.routes, overview, capabilities],
  );
  const extensions = capabilities.filter((entry) => !KNOWN.has(entry.key));
  const counts = capabilities
    .filter((entry) => KNOWN.has(entry.key))
    .reduce(
      (result, entry) => {
        result[entry.status ?? 'undetermined']++;
        return result;
      },
      { active: 0, needsSetup: 0, unused: 0, undetermined: 0 },
    );
  const close = (): void => {
    void navigate(basePath, { replace: true });
  };
  const card = (entry: FoundationCapability): ReactElement => {
    const Icon = CAPABILITY_ICONS[entry.key] ?? Layers;
    return (
      <li key={entry.key} className='min-w-0'>
        <Button
          variant='ghost'
          onClick={() =>
            void navigate(`${basePath}/${encodeURIComponent(entry.key)}`)
          }
          className='group flex h-auto w-full items-start justify-start gap-3 rounded-lg px-3 py-3.5 text-left font-normal whitespace-normal hover:bg-muted/70'
        >
          <span className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-foreground'>
            <Icon className='size-4' aria-hidden />
          </span>
          <span className='flex min-w-0 flex-1 flex-col gap-1'>
            <span className='flex flex-wrap items-center justify-between gap-x-3 gap-y-1'>
              <span className='font-medium wrap-anywhere'>{name(entry)}</span>
              <State value={entry.status} />
            </span>
            <span className='text-xs leading-relaxed text-muted-foreground'>
              {description(entry)}
            </span>
          </span>
          <ChevronRight
            className='mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            aria-hidden
          />
        </Button>
      </li>
    );
  };
  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8'>
      <header className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <p className='mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground'>
            <Layers className='size-3.5' aria-hidden />
            NocoBase Core<span className='text-border'>/</span>
            {t('preview.label')}
          </p>
          <h1 className='font-heading text-2xl font-semibold tracking-tight'>
            {t('page.title')}
          </h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            {t('preview.description')}
          </p>
        </div>
        <div className='flex flex-col items-start gap-2 sm:items-end'>
          {refresh ? (
            <Button variant='outline' disabled={refreshing} onClick={refresh}>
              <RefreshCw
                className={cn(
                  'size-3.5',
                  refreshing && 'motion-safe:animate-spin',
                )}
                aria-hidden
              />
              {t(refreshing ? 'page.refreshing' : 'preview.refresh')}
            </Button>
          ) : null}
          <p className='text-xs text-muted-foreground'>
            {t('page.updatedAt', {
              time: formatTime(overview.checkedAt, locale),
            })}
          </p>
        </div>
      </header>
      {failed ? (
        <p role='alert' className='text-sm text-destructive'>
          {t('page.refreshFailed')}
        </p>
      ) : null}
      {refreshing ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('page.updatingHistory')}
        </p>
      ) : null}
      <div className='flex flex-wrap items-center justify-between gap-3 border-b pb-5'>
        <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm'>
          <span className='flex items-center gap-2'>
            <span className='size-1.5 rounded-full bg-primary' />
            {t('status.legendActive', { count: counts.active })}
          </span>
          <span className='text-muted-foreground'>
            {t('status.legendNeedsSetup', { count: counts.needsSetup })}
          </span>
          {counts.undetermined ? (
            <span className='text-muted-foreground'>
              {t('page.undetermined', { count: counts.undetermined })}
            </span>
          ) : null}
        </div>
        <div className='relative w-full sm:w-60'>
          <Search
            className='pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground'
            aria-hidden
          />
          <Input
            type='search'
            aria-label={t('page.searchCapabilities')}
            placeholder={t('page.searchCapabilities')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className='bg-background pl-8'
          />
        </div>
      </div>
      <div className='grid items-start gap-x-5 gap-y-5 md:grid-cols-2'>
        {GROUPS.map((group) => {
          const items = capabilities.filter(
            (entry) =>
              (group.capabilities as readonly string[]).includes(entry.key) &&
              matches(entry),
          );
          return items.length ? (
            <section
              key={group.key}
              aria-label={t(`preview.${group.key}`)}
              className='min-w-0 rounded-xl border bg-card p-2 text-card-foreground'
            >
              <h2 className='px-3 pt-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground'>
                {t(`preview.${group.key}`)}
              </h2>
              <ul>{items.map(card)}</ul>
            </section>
          ) : null;
        })}
      </div>
      {!capabilities.some(matches) ? (
        <p
          role='status'
          className='py-8 text-center text-sm text-muted-foreground'
        >
          {t('page.noCapabilities')}
        </p>
      ) : null}
      <div className='text-sm'>
        {extensions.length > 0 ? (
          <Fold
            title={`${t('inventory.extensionsTitle')} (${extensions.length})`}
          >
            <p className='mb-3 text-sm text-muted-foreground'>
              {t('inventory.extensionsDescription')}
            </p>
            <ul className='grid gap-2 md:grid-cols-2'>
              {extensions.filter(matches).map(card)}
            </ul>
          </Fold>
        ) : null}
        <Fold title={t('matrix.title')}>
          <p className='mb-4 text-muted-foreground'>{t('matrix.legend')}</p>
          {modules.length ? (
            <ul className='divide-y'>
              {modules.map((module) => (
                <li
                  key={module.id}
                  className='grid gap-2 py-3 sm:grid-cols-[12rem_1fr]'
                >
                  <span className='font-medium'>{text(module.title)}</span>
                  <span className='flex flex-wrap gap-2'>
                    {module.links.map((link) => {
                      const entry = capabilities.find(
                        (item) => item.key === link.capability,
                      );
                      return entry ? (
                        <Button
                          key={link.capability}
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            void navigate(
                              `${basePath}/${encodeURIComponent(entry.key)}`,
                            )
                          }
                        >
                          {name(entry)}
                          <ArrowUpRight className='size-3' aria-hidden />
                        </Button>
                      ) : null;
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-muted-foreground'>{t('matrix.empty')}</p>
          )}
        </Fold>
      </div>
      <Dialog
        open={Boolean(selectedKey)}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className='fixed inset-y-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-xl'
        >
          <div className='flex items-start justify-between gap-3 border-b p-6'>
            <div>
              <DialogTitle className='text-xl font-semibold'>
                {selected ? name(selected) : t('page.unavailable')}
              </DialogTitle>
              <DialogDescription className='mt-2 leading-relaxed'>
                {selected ? description(selected) : t('page.noCapabilities')}
              </DialogDescription>
            </div>
            <DialogClose
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={t('preview.close')}
                />
              }
            >
              <X className='size-4' />
            </DialogClose>
          </div>
          {selected ? (
            <div className='min-h-0 flex-1 overflow-y-auto p-6'>
              <State value={selected.status} />
              {selected.completeness !== 'complete' ? (
                <p className='mt-4 text-sm text-muted-foreground'>
                  {t(
                    selected.completeness === 'failed'
                      ? 'detail.failed'
                      : 'detail.partial',
                  )}
                </p>
              ) : null}
              <h3 className='mt-6 mb-3 text-sm font-semibold'>
                {t('detail.inThisApp')}
              </h3>
              {selected.facts.length ? (
                <ul className='flex list-disc flex-col gap-3 pl-4 text-sm leading-relaxed marker:text-muted-foreground'>
                  {selected.facts.map((fact) => (
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
                  {selected.reason
                    ? word(`reasons.${selected.reason}`)
                    : t('detail.noFacts')}
                </p>
              )}
              {KNOWN.has(selected.key) && selected.status !== null ? (
                <div className='my-6 rounded-lg bg-muted/60 p-4'>
                  <h3 className='mb-2 text-sm font-medium'>
                    {t(
                      selected.status === 'active'
                        ? 'detail.withoutFoundation'
                        : 'detail.onceInUse',
                    )}
                  </h3>
                  <p className='text-sm leading-relaxed text-muted-foreground'>
                    {t(
                      `capabilities.${selected.key}.${selected.status === 'active' ? 'without' : 'onceInUse'}`,
                    )}
                  </p>
                </div>
              ) : null}
              <Fold title={t('preview.technical')}>
                <dl className='mb-5 divide-y'>
                  {selected.metrics.map((metric) => (
                    <div
                      key={metric.key}
                      className='flex items-center justify-between gap-4 py-3 text-sm'
                    >
                      <dt className='text-muted-foreground'>
                        {word(`metrics.${metric.key}`)}
                      </dt>
                      <dd className='text-right font-medium tabular-nums'>
                        {formatMetricValue(metric, locale) ??
                          t('page.unavailable')}
                        {!metric.complete && metric.value !== null ? (
                          <span className='block text-xs font-normal text-muted-foreground'>
                            {t('page.lowerBound')}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
                <h3 className='mb-3 text-sm font-medium'>
                  {t('detail.packages')}
                </h3>
                <ul className='flex flex-col gap-3 text-xs'>
                  {selected.packages.map((entry) => (
                    <li
                      key={entry.name}
                      className='flex flex-wrap justify-between gap-2'
                    >
                      <span className='font-mono wrap-anywhere'>
                        {entry.name}
                      </span>
                      <span className='text-muted-foreground'>
                        {entry.version ?? t('page.unavailable')}
                      </span>
                    </li>
                  ))}
                </ul>
              </Fold>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
