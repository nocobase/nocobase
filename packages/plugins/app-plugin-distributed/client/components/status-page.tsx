import { useService } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  CircleAlert,
  CircleCheck,
  Info,
  Square,
  TriangleAlert,
} from 'lucide-react';
import {
  Component,
  Suspense,
  lazy,
  useMemo,
  type ComponentType,
  type ErrorInfo,
  type ReactElement,
  type ReactNode,
} from 'react';

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

const BADGE_TONES: Readonly<Record<DistributedCheckLevel, string>> = {
  required: 'border-destructive/20 bg-destructive/10 text-destructive',
  recommended:
    'border-(--status-warning)/20 bg-(--status-warning-background) text-(--status-warning)',
  ok: 'border-(--status-success)/20 bg-(--status-success-background) text-(--status-success)',
};

const SHARING_TONES: Readonly<Record<DistributedSharing, string>> = {
  shared:
    'border-(--status-success)/20 bg-(--status-success-background) text-(--status-success)',
  local: 'border-border bg-muted text-muted-foreground',
  unknown:
    'border-(--status-warning)/20 bg-(--status-warning-background) text-(--status-warning)',
};

function Badge({
  className,
  children,
}: {
  readonly className: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className='flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground'>
      <h2 className='text-base font-semibold'>{title}</h2>
      {children}
    </section>
  );
}

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

function CheckRow({
  check,
}: {
  readonly check: DistributedCheckResult;
}): ReactElement {
  const { t } = useText();
  const text = useCheckText()(check);
  const { icon: Icon, tone } = LEVEL_STYLES[check.level];
  return (
    <li
      className='flex gap-3 border-b py-3 last:border-b-0'
      data-check={check.id}
    >
      <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${tone}`} />
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-medium'>{text.title}</span>
          <Badge className={BADGE_TONES[check.level]}>
            {t(`level.${check.level}`)}
          </Badge>
        </div>
        <p className='text-sm break-words text-muted-foreground'>
          {text.detail}
        </p>
        {check.fix ? (
          <details className='text-sm'>
            <summary className='cursor-pointer text-primary'>
              {t('fix')}
            </summary>
            <div className='mt-2 flex flex-col gap-2'>
              <p>{text.fix}</p>
              {check.fix.snippet ? <Snippet code={check.fix.snippet} /> : null}
            </div>
          </details>
        ) : null}
      </div>
    </li>
  );
}

function Summary({
  status,
}: {
  readonly status: DistributedStatus;
}): ReactElement {
  const { t } = useText();
  const present = status.services.filter((service) => service.available);
  const shared = present.filter(
    (service) => service.sharing === 'shared',
  ).length;
  const count = (level: DistributedCheckLevel) =>
    status.checks.filter((check) => check.level === level).length;
  const required = count('required');
  // One instance can still have blocking items, such as an adapter no plugin provides; then the summary says so.
  const cards =
    status.mode === 'single'
      ? [
          {
            value: t('summary.single'),
            caption:
              required > 0
                ? t('summary.singleBlockedCaption')
                : t('summary.singleCaption'),
          },
          {
            value: t('summary.shared', { shared, total: present.length }),
            caption: t('summary.sharedCaption'),
          },
          ...(required > 0
            ? [
                {
                  value: String(required),
                  caption: t('summary.requiredCaption'),
                  tone: 'text-destructive',
                },
              ]
            : []),
        ]
      : [
          {
            value: t('summary.shared', { shared, total: present.length }),
            caption: t('summary.sharedCaption'),
          },
          {
            value: String(required),
            caption: t('summary.requiredCaption'),
            tone: required > 0 ? 'text-destructive' : undefined,
          },
          {
            value: String(count('recommended')),
            caption: t('summary.recommendedCaption'),
          },
        ];
  return (
    <div
      className={`grid grid-cols-1 gap-3 ${cards.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
    >
      {cards.map((card) => (
        <div
          key={card.caption}
          className='flex flex-col gap-1 rounded-lg border bg-card p-4'
        >
          <span
            className={`text-xl font-semibold ${'tone' in card && card.tone ? card.tone : ''}`}
          >
            {card.value}
          </span>
          <span className='text-sm text-muted-foreground'>{card.caption}</span>
        </div>
      ))}
    </div>
  );
}

function ServiceBackend({
  service,
}: {
  readonly service: DistributedService;
}): ReactElement {
  const { t } = useText();
  return (
    <div className='flex min-w-0 flex-col gap-0.5'>
      <span className='font-mono text-xs break-all'>
        {service.configPath} → {service.default ?? t('notSet')}
      </span>
      <span className='text-xs text-muted-foreground'>
        {t('table.adapter')}: {service.adapter}
        {service.registered ? '' : ` · ${t('unregistered')}`}
      </span>
      {service.selections.length > 0 ? (
        <span className='text-xs text-muted-foreground'>
          {t('selections')}:{' '}
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
        </span>
      ) : null}
    </div>
  );
}

function useServiceCells(service: DistributedService): {
  readonly name: ReactElement;
  readonly backend: ReactElement;
  readonly sharing: ReactElement;
  readonly plugin: ReactElement;
  readonly source: ReactElement;
} {
  const { t } = useText();
  return {
    name: (
      <div className='flex flex-col gap-0.5'>
        <span className='font-medium'>{t(`services.${service.key}.name`)}</span>
        <span className='text-xs text-muted-foreground'>
          {t(`services.${service.key}.usage`)}
        </span>
      </div>
    ),
    backend: service.available ? (
      <ServiceBackend service={service} />
    ) : (
      <span className='text-xs text-muted-foreground'>{t('unavailable')}</span>
    ),
    sharing: (
      <Badge className={SHARING_TONES[service.sharing]}>
        {t(`sharing.${service.sharing}`)}
      </Badge>
    ),
    plugin: (
      <span className='font-mono text-xs break-all'>
        {REDIS_PLUGINS[service.key]}
      </span>
    ),
    source: <span className='text-sm'>{t(`source.${service.source}`)}</span>,
  };
}

function ServiceRow({
  service,
}: {
  readonly service: DistributedService;
}): ReactElement {
  const cells = useServiceCells(service);
  return (
    <tr className='border-b align-top last:border-b-0'>
      <td className='py-3 pr-4'>{cells.name}</td>
      <td className='py-3 pr-4'>{cells.backend}</td>
      <td className='py-3 pr-4'>{cells.sharing}</td>
      <td className='py-3 pr-4'>{cells.plugin}</td>
      <td className='py-3'>{cells.source}</td>
    </tr>
  );
}

function ServiceCard({
  service,
}: {
  readonly service: DistributedService;
}): ReactElement {
  const { t } = useText();
  const cells = useServiceCells(service);
  return (
    <li className='flex flex-col gap-2 border-b py-3 last:border-b-0'>
      <div className='flex items-start justify-between gap-2'>
        {cells.name}
        {cells.sharing}
      </div>
      {cells.backend}
      <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
        <span>
          {t('table.plugin')}: {cells.plugin}
        </span>
        <span>
          {t('table.source')}: {cells.source}
        </span>
      </div>
    </li>
  );
}

function Services({
  status,
}: {
  readonly status: DistributedStatus;
}): ReactElement {
  const { t } = useText();
  const local = status.services.filter(
    (service) => service.available && service.sharing !== 'shared',
  );
  return (
    <Section title={t('sections.services')}>
      <table className='hidden w-full text-left text-sm md:table'>
        <thead className='text-xs text-muted-foreground'>
          <tr className='border-b'>
            <th className='py-2 pr-4 font-medium'>{t('table.service')}</th>
            <th className='py-2 pr-4 font-medium'>{t('table.backend')}</th>
            <th className='py-2 pr-4 font-medium'>{t('table.sharing')}</th>
            <th className='py-2 pr-4 font-medium'>{t('table.plugin')}</th>
            <th className='py-2 font-medium'>{t('table.source')}</th>
          </tr>
        </thead>
        <tbody>
          {status.services.map((service) => (
            <ServiceRow key={service.key} service={service} />
          ))}
        </tbody>
      </table>
      <ul className='md:hidden'>
        {status.services.map((service) => (
          <ServiceCard key={service.key} service={service} />
        ))}
      </ul>
      {local.length > 0 ? (
        <details className='text-sm'>
          <summary className='cursor-pointer text-primary'>
            {t('howToChange')}
          </summary>
          <div className='mt-2 flex flex-col gap-2'>
            <p>{t('howToChangeIntro')}</p>
            {local.map((service) => (
              <Snippet
                key={service.key}
                code={sharedBackendSnippet(service.key)}
              />
            ))}
          </div>
        </details>
      ) : null}
      <SlotBlocks slot='services' status={status} />
    </Section>
  );
}

function IdGeneration({
  status,
}: {
  readonly status: DistributedStatus;
}): ReactElement {
  const { t } = useText();
  const { idGeneration } = status;
  return (
    <Section title={t('sections.idGeneration')}>
      <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
        <dt className='text-muted-foreground'>{t('idGeneration.mode')}</dt>
        <dd>
          {idGeneration.mode === 'auto'
            ? t('idGeneration.auto')
            : t('idGeneration.manual', {
                workerId: idGeneration.workerId ?? '—',
              })}
        </dd>
        <dt className='text-muted-foreground'>{t('table.source')}</dt>
        <dd>{t(`source.${idGeneration.source}`)}</dd>
      </dl>
      {idGeneration.mode === 'manual' ? (
        <p className='text-sm text-muted-foreground'>
          {t('idGeneration.modeHint')}
        </p>
      ) : null}
      <SlotBlocks slot='idGeneration' status={status} />
    </Section>
  );
}

const CHECKLIST = [
  'files',
  'realtime',
  'queue',
  'secrets',
  'websocket',
] as const;

function Checklist({
  status,
}: {
  readonly status: DistributedStatus;
}): ReactElement {
  const { t } = useText();
  return (
    <Section title={t('sections.checklist')}>
      <p className='text-sm text-muted-foreground'>{t('checklist.intro')}</p>
      <ul className='flex flex-col gap-2 text-sm'>
        {CHECKLIST.map((item) => (
          <li key={item} className='flex gap-2'>
            <Square
              aria-hidden
              className='mt-0.5 size-4 shrink-0 text-muted-foreground'
            />
            <span>{t(`checklist.${item}`)}</span>
          </li>
        ))}
      </ul>
      <SlotBlocks slot='checklist' status={status} />
    </Section>
  );
}

function Notes(): ReactElement {
  const { t } = useText();
  return (
    <Section title={t('sections.notes')}>
      <ul className='flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground'>
        <li>{t('notes.current')}</li>
        <li>{t('notes.noTest')}</li>
        <li>{t('notes.instances')}</li>
      </ul>
    </Section>
  );
}

export function DistributedStatusView({
  status,
}: {
  readonly status: DistributedStatus;
}): ReactElement {
  const { t } = useText();
  const blocked = status.checks.some(({ level }) => level === 'required');
  return (
    <>
      <Summary status={status} />
      <Section title={t('sections.scale')}>
        {status.mode === 'single' ? (
          <div
            role='note'
            className={`flex gap-2 rounded-md border p-3 text-sm ${blocked ? 'border-destructive/20 bg-destructive/5' : 'border-primary/15 bg-primary/5'}`}
          >
            <Info
              aria-hidden
              className={`mt-0.5 size-4 shrink-0 ${blocked ? 'text-destructive' : 'text-primary'}`}
            />
            <span>{t(blocked ? 'singleBlocked' : 'singleHint')}</span>
          </div>
        ) : null}
        <ul>
          {status.checks.map((check) => (
            <CheckRow
              key={`${check.id}:${JSON.stringify(check.params ?? {})}`}
              check={check}
            />
          ))}
        </ul>
        <SlotBlocks slot='overview' status={status} />
      </Section>
      <Services status={status} />
      <IdGeneration status={status} />
      <Checklist status={status} />
      <Notes />
    </>
  );
}

export default function DistributedStatusPage(): ReactElement {
  const { t } = useText();
  const { status, error, loading, reload } = useDistributedStatus();
  return (
    <div className='flex w-full min-w-0 flex-col gap-4 p-4 md:p-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='font-heading text-2xl font-semibold'>
          {t('nav.title')}
        </h1>
        <p className='max-w-3xl text-sm text-muted-foreground'>
          {t('page.description')}
        </p>
      </header>
      {status ? (
        <DistributedStatusView status={status} />
      ) : loading ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('page.loading')}
        </p>
      ) : (
        <div
          role='alert'
          className='flex flex-wrap items-center gap-3 text-sm text-destructive'
        >
          <span>{t('page.loadFailed')}</span>
          {error === 'failed' ? (
            <button
              type='button'
              className='rounded-md border px-3 py-1 text-foreground'
              onClick={reload}
            >
              {t('page.retry')}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
