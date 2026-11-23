import { useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  CircleAlert,
  CircleCheck,
  ChevronRight,
  Server,
  TriangleAlert,
} from 'lucide-react';
import {
  Component,
  Suspense,
  lazy,
  useMemo,
  useState,
  type ComponentType,
  type ErrorInfo,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useOutletContext,
  useResolvedPath,
  matchPath,
} from 'react-router';

import { REDIS_PLUGINS, sharedBackendSnippet } from '../../shared/snippets.js';
import type {
  DistributedCheckLevel,
  DistributedCheckResult,
  DistributedService,
  DistributedSharing,
  DistributedStatus,
} from '../../shared/types.js';
import {
  distributedStatusSlotsToken,
  type DistributedStatusBlockProps,
  type DistributedStatusSlot,
} from '../slots.js';
import { useDistributedStatus } from './use-status.js';

const NAMESPACE = '@nocobase/app-plugin-distributed';

type Translate = (key: string, options?: Record<string, unknown>) => string;

function useText(): {
  readonly t: Translate;
  readonly has: (key: string) => boolean;
} {
  const { t, i18n } = useTranslation(NAMESPACE);
  return {
    t,
    has: (key) => i18n.exists(key, { ns: NAMESPACE }),
  };
}

const LEVEL_STYLES: Readonly<
  Record<DistributedCheckLevel, { icon: typeof CircleCheck; tone: string }>
> = {
  required: { icon: CircleAlert, tone: 'text-destructive' },
  recommended: { icon: TriangleAlert, tone: 'text-(--status-warning)' },
  ok: { icon: CircleCheck, tone: 'text-(--status-success)' },
};

function Snippet({ code }: { readonly code: string }): ReactElement {
  return (
    <pre className='overflow-x-auto rounded-md bg-muted p-3 text-xs leading-relaxed'>
      <code>{code}</code>
    </pre>
  );
}

class BlockBoundary extends Component<
  { readonly id: string; readonly children: ReactNode },
  { readonly failed: boolean }
> {
  public override state = { failed: false };

  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      `Distributed status block "${this.props.id}" failed.`,
      error,
      info.componentStack,
    );
  }

  public override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

function SlotBlocks({
  slot,
  status,
}: {
  readonly slot: DistributedStatusSlot;
  readonly status: DistributedStatus;
}): ReactElement | null {
  const slots = useService(distributedStatusSlotsToken);
  const blocks = useMemo(
    () =>
      slots.list(slot).map((block) => ({
        id: block.id,
        Block: lazy(block.load) as ComponentType<DistributedStatusBlockProps>,
      })),
    [slots, slot],
  );
  if (blocks.length === 0) return null;
  return (
    <>
      {blocks.map(({ id, Block }) => (
        <BlockBoundary key={id} id={id}>
          <Suspense fallback={null}>
            <div data-slot-block={id}>
              <Block status={status} />
            </div>
          </Suspense>
        </BlockBoundary>
      ))}
    </>
  );
}

function useCheckText(): (check: DistributedCheckResult) => {
  readonly title: string;
  readonly detail: string;
  readonly fix?: string;
} {
  const { t, has } = useText();
  return (check) => {
    const params: Record<string, unknown> = { ...check.params };
    if (typeof params.service === 'string')
      params.service = t(`services.${params.service}.name`);
    if (Array.isArray(params.services))
      params.services = params.services
        .map((key: string) => t(`services.${key}.name`))
        .join(', ');
    if (Array.isArray(params.collections))
      params.collections = params.collections.join(', ');
    if (Array.isArray(params.connections))
      params.connections = params.connections.join(', ');
    const key = `checks.${check.id}`;
    if (!has(`${key}.title`))
      return { title: check.title, detail: check.detail, fix: check.fix?.text };
    return {
      title: t(`${key}.title`, params),
      detail: t(`${key}.detail`, params),
      fix: check.fix
        ? has(`${key}.fix`)
          ? t(`${key}.fix`, params)
          : check.fix.text
        : undefined,
    };
  };
}

const card = 'overflow-hidden rounded-lg border bg-card text-card-foreground';
const disclosure =
  'flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 focus-visible:outline-ring [&::-webkit-details-marker]:hidden';

function Arrow(): ReactElement {
  return (
    <ChevronRight
      aria-hidden
      className='size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90'
    />
  );
}

function Summary({ status }: DistributedStatusBlockProps): ReactElement {
  const { t } = useText();
  const { search } = useLocation();
  const present = status.services.filter((service) => service.available);
  const shared = present.filter(
    (service) => service.sharing === 'shared',
  ).length;
  const blocked = status.checks.filter(
    (check) => check.level === 'required',
  ).length;
  return (
    <section
      className={`${card} flex flex-wrap items-center gap-x-3 gap-y-2 p-4`}
    >
      <span className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
        <Server aria-hidden className='size-5' />
      </span>
      <div className='flex-1'>
        <p className='text-xs text-muted-foreground'>{t('view.deployment')}</p>
        <p className='text-lg font-semibold'>
          {t(status.mode === 'single' ? 'summary.single' : 'view.multi')}
        </p>
      </div>
      <div className='text-right'>
        <div aria-hidden className='mb-1 flex justify-end gap-1'>
          {present.map((service) => (
            <span
              key={service.key}
              className={`h-1 w-4 rounded-full ${service.sharing === 'shared' ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <span className='text-xs text-muted-foreground'>
          {t('sections.services')}{' '}
          <strong className='tabular-nums text-foreground'>
            {t('summary.shared', { shared, total: present.length })}
          </strong>
        </span>
      </div>
      {blocked > 0 && (
        <Link
          to={{ pathname: 'checks', search }}
          className='flex w-full items-center gap-2 text-sm text-destructive hover:underline'
        >
          <CircleAlert aria-hidden className='size-4' />
          {t('view.blockers', { count: blocked })}
          <ChevronRight aria-hidden className='size-3' />
        </Link>
      )}
    </section>
  );
}

const columns =
  'grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_1rem] items-center gap-2 px-3 sm:px-4';
const sharingTone: Record<DistributedSharing, string> = {
  shared: 'bg-(--status-success)',
  local: 'bg-muted-foreground',
  unknown: 'bg-(--status-warning)',
};

function ServiceRow({
  service,
}: {
  readonly service: DistributedService;
}): ReactElement {
  const { t } = useText();
  return (
    <details className='group border-t'>
      <summary
        className={`${columns} cursor-pointer list-none py-3 text-sm hover:bg-muted/50 [&::-webkit-details-marker]:hidden`}
      >
        <span className='font-medium'>{t(`services.${service.key}.name`)}</span>
        <span className='min-w-0 break-all font-mono text-xs'>
          {service.available
            ? (service.default ?? (service.adapter || t('notSet')))
            : t('unavailable')}
        </span>
        <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          {service.available ? (
            <>
              <i
                aria-hidden
                className={`size-1.5 shrink-0 rounded-full ${sharingTone[service.sharing]}`}
              />
              {t(`sharing.${service.sharing}`)}
            </>
          ) : (
            '—'
          )}
        </span>
        <Arrow />
      </summary>
      <div className='space-y-1.5 bg-muted/40 px-4 py-3 text-sm text-muted-foreground'>
        <p>{t(`services.${service.key}.usage`)}</p>
        {service.available && (
          <>
            <p>
              <code>{service.configPath}</code> ·{' '}
              {t(`source.${service.source}`)}
            </p>
            <p>
              {t('table.adapter')} ·{' '}
              <code>{service.adapter || t('notSet')}</code>
              {!service.registered && (
                <span className='ml-2 text-destructive'>
                  {t('unregistered')}
                </span>
              )}
            </p>
            {service.selections.length > 0 && (
              <p className='break-words'>
                {t('selections')} ·{' '}
                {service.selections
                  .map((selection) =>
                    selection.consumer
                      ? t('selection', {
                          consumer: selection.consumer,
                          backend: selection.backend,
                        })
                      : selection.backend,
                  )
                  .join(', ')}
              </p>
            )}
            <p className='break-all'>
              {t('table.plugin')} · <code>{REDIS_PLUGINS[service.key]}</code>
            </p>
            {service.sharing !== 'shared' && (
              <details>
                <summary className='w-fit cursor-pointer text-primary'>
                  {t('howToChange')}
                </summary>
                <p className='my-2'>{t('howToChangeIntro')}</p>
                <Snippet code={sharedBackendSnippet(service.key)} />
              </details>
            )}
          </>
        )}
      </div>
    </details>
  );
}

export function Configuration(): ReactElement {
  const status = useOutletContext<DistributedStatus>();
  const { t } = useText();
  return (
    <>
      <section className={card}>
        <h2 className='px-4 py-3 text-base font-semibold'>
          {t('view.backends')}
        </h2>
        <div
          className={`${columns} bg-muted/50 py-2 text-xs text-muted-foreground`}
        >
          <span>{t('table.service')}</span>
          <span>{t('table.backend')}</span>
          <span>{t('table.sharing')}</span>
        </div>
        {status.services.map((service) => (
          <ServiceRow key={service.key} service={service} />
        ))}
      </section>
      <SlotBlocks slot='services' status={status} />
      <details className={`group ${card}`}>
        <summary className={disclosure}>
          <span className='font-medium'>{t('sections.idGeneration')}</span>
          <span className='ml-auto text-sm text-muted-foreground'>
            {status.idGeneration.mode === 'auto'
              ? t('idGeneration.auto')
              : t('idGeneration.manual', {
                  workerId: status.idGeneration.workerId ?? '—',
                })}
          </span>
          <Arrow />
        </summary>
        <p className='border-t px-4 py-3 text-sm text-muted-foreground'>
          {t('table.source')} · {t(`source.${status.idGeneration.source}`)}
        </p>
      </details>
      <SlotBlocks slot='idGeneration' status={status} />
      <p className='text-xs text-muted-foreground'>{t('view.scope')}</p>
    </>
  );
}

function CheckRow({
  check,
}: {
  readonly check: DistributedCheckResult;
}): ReactElement {
  const { t } = useText();
  const text = useCheckText()(check);
  const { icon: Icon, tone } = LEVEL_STYLES[check.level];
  const grouped = check.id === 'services.local';
  const label = (
    <>
      <Icon aria-hidden className={`size-4 shrink-0 ${tone}`} />
      <span className='min-w-0 flex-1'>
        <strong className='font-medium'>
          {grouped ? t('view.backends') : text.title}
        </strong>
        <span className='block break-words text-xs text-muted-foreground'>
          {text.detail}
        </span>
      </span>
      <span className={`text-xs ${tone}`}>{t(`level.${check.level}`)}</span>
    </>
  );
  return (
    <li className='border-t first:border-t-0' data-check={check.id}>
      {check.fix || grouped ? (
        <details className='group'>
          <summary className={disclosure}>
            {label}
            <Arrow />
          </summary>
          <div className='space-y-2 bg-muted/40 px-4 py-3 text-sm'>
            {text.fix && <p>{text.fix}</p>}
            {check.fix?.snippet && <Snippet code={check.fix.snippet} />}
            {grouped && (
              <Link className='text-primary underline' to='../configuration'>
                {t('view.configuration')}
              </Link>
            )}
          </div>
        </details>
      ) : (
        <div className='flex items-center gap-3 px-4 py-3 pr-11'>{label}</div>
      )}
    </li>
  );
}

const CHECKLIST = [
  'files',
  'realtime',
  'queue',
  'secrets',
  'websocket',
] as const;

export function Checks(): ReactElement {
  const { t } = useText();
  const status = useOutletContext<DistributedStatus>();
  const [all, setAll] = useState(false);
  const checks = all
    ? status.checks
    : status.checks.filter((check) => check.level !== 'ok');
  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <h2 className='text-base font-semibold'>{t('view.readiness')}</h2>
        <div className='flex gap-1'>
          {(['pending', 'all'] as const).map((filter) => {
            const active = (filter === 'all') === all;
            return (
              <button
                key={filter}
                type='button'
                aria-pressed={active}
                onClick={() => setAll(filter === 'all')}
                className={`rounded-md px-2.5 py-1 text-xs ${active ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                {t(`view.${filter}`)}
              </button>
            );
          })}
        </div>
      </div>
      {checks.length ? (
        <ul className={card}>
          {checks.map((check) => (
            <CheckRow
              key={`${check.id}:${JSON.stringify(check.params ?? {})}`}
              check={check}
            />
          ))}
        </ul>
      ) : (
        <p className={`${card} px-4 py-3 text-sm text-muted-foreground`}>
          {t('view.empty')}
        </p>
      )}
      <details className={`group ${card}`}>
        <summary className={disclosure}>
          <span className='font-medium'>{t('sections.checklist')}</span>
          <Arrow />
        </summary>
        <div className='border-t px-4 py-3 text-sm'>
          <p className='text-muted-foreground'>{t('checklist.intro')}</p>
          <ul className='mt-2 list-disc space-y-1 pl-5'>
            {CHECKLIST.map((item) => (
              <li key={item}>{t(`checklist.${item}`)}</li>
            ))}
          </ul>
        </div>
      </details>
      <SlotBlocks slot='checklist' status={status} />
    </>
  );
}

export default function DistributedStatusPage(): ReactElement {
  const { t } = useText();
  const { status, error, loading, reload } = useDistributedStatus();
  const { pathname, search } = useLocation();
  const parent = useResolvedPath('.');
  const atParent = matchPath({ path: parent.pathname, end: true }, pathname);
  return (
    <section className='flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6 md:p-8'>
      <h1 className='font-heading text-2xl font-semibold'>{t('nav.title')}</h1>
      {status ? (
        <>
          {atParent && (
            <Navigate replace to={{ pathname: 'configuration', search }} />
          )}
          <Summary status={status} />
          <SlotBlocks slot='overview' status={status} />
          <nav aria-label={t('nav.title')} className='flex gap-5 border-b'>
            {(['configuration', 'checks'] as const).map((path) => (
              <NavLink
                key={path}
                to={{ pathname: path, search }}
                className={({ isActive }) =>
                  `border-b-2 py-2 text-sm font-medium ${isActive ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`
                }
              >
                {t(`view.${path}`)}
              </NavLink>
            ))}
          </nav>
          <Outlet context={status} />
        </>
      ) : loading ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('page.loading')}
        </p>
      ) : (
        <div
          role='alert'
          className='flex items-center gap-3 text-sm text-destructive'
        >
          {t('page.loadFailed')}
          {error === 'failed' && (
            <button
              type='button'
              className='rounded-md border px-3 py-1 text-foreground'
              onClick={reload}
            >
              {t('page.retry')}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
