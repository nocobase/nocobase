import { useState, type ReactElement, type ReactNode } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Plus } from 'lucide-react';

import type { DurableFlow } from '../../shared/flows.js';
import { text } from '../../shared/text.js';
import {
  blockerMessage,
  errorMessage,
  type Plain,
  type RecordDetail,
} from '../lib/api.js';
import { flowApi } from '../lib/flow-api.js';
import { useFollowUp } from '../lib/use-follow-up.js';
import { useLifecycleChanges } from '../lib/use-lifecycle-changes.js';
import { ago, NAMESPACE } from '../lib/format.js';
import { visitedStates } from '../lib/diagram.js';
import {
  useExampleLifecycle,
  useTranslate,
} from '../lib/use-example-record.js';
import { useLoader } from '../lib/use-loader.js';
import { useNow } from '../lib/use-now.js';
import { cn } from '../lib/utils.js';
import { ExampleGuide } from './example-guide.js';
import { FlowDiagram } from './flow-diagram.js';
import { PageContainer } from './page-container.js';
import { PageHeader } from './page-header.js';
import {
  Banner,
  DiagramSource,
  Field,
  LifecyclePanel,
  StateBadge,
} from './record-ui.js';
import { Button } from './ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card.js';

type Tone = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

export interface FlowField {
  readonly label: string;
  readonly value: ReactNode;
}

export interface FlowBanner {
  readonly tone: Tone;
  readonly text: ReactNode;
}

/** What a flow's own parts receive: the record as the page acts on it. */
export interface FlowDetailProps {
  readonly detail: RecordDetail;
  readonly now: number;
  /**
   * Moves on whenever the record may have changed — a push about it, a
   * follow-up, an action — so what a card loads beside it reloads too.
   */
  readonly revision: number;
  /** Reloads the record and whatever the page shows around it. */
  readonly reload: () => Promise<void>;
}

export interface FlowFormProps {
  readonly onCancel: () => void;
  readonly onCreated: (id: string) => Promise<void>;
}

export interface FlowPageProps {
  readonly flow: DurableFlow;
  /** The page's description, quoting the lifecycle's parameters. */
  readonly description: (
    parameters: Readonly<Record<string, unknown>>,
  ) => string;
  readonly title: (record: Plain) => string;
  readonly subtitle: (record: Plain) => string;
  readonly fields: (detail: RecordDetail) => readonly FlowField[];
  readonly banner: (detail: RecordDetail, now: number) => FlowBanner | null;
  /** Transitions whose button reads as giving something up. */
  readonly destructive?: readonly string[];
  readonly Form: (props: FlowFormProps) => ReactElement;
  /** The card that plays the outside world for this record. */
  readonly Outside: (props: FlowDetailProps) => ReactElement;
}

/**
 * The page every durable flow shares: the records, and for the one
 * selected its details and actions, the lifecycle drawn with the record's
 * place in it, a card that plays the systems outside the application, and
 * what the lifecycle recorded. There is no persona: these flows are about
 * waiting for the outside, and a person's step is the signed-in user's.
 */
export function FlowPage(props: FlowPageProps): ReactElement {
  const { flow } = props;
  const { t, i18n } = useTranslation(NAMESPACE);
  const client = flowApi(useApiClient());
  const translate = useTranslate();
  const now = useNow();
  const [selected, setSelected] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [revision, setRevision] = useState(0);

  const list = useLoader(() => client.list(flow), flow);
  const lifecycle = useExampleLifecycle(flow, selected);
  const detail: RecordDetail | undefined =
    lifecycle.view && lifecycle.description
      ? { ...lifecycle.view, ...lifecycle.description }
      : undefined;
  const loadError = lifecycle.error
    ? errorMessage(lifecycle.error, translate)
    : '';
  const records = list.data?.records ?? [];

  const reloadRecord = async (): Promise<void> => {
    setRevision((value) => value + 1);
    await lifecycle.reload();
  };
  const reload = async (): Promise<void> => {
    await Promise.all([list.reload(), reloadRecord()]);
  };

  // Told by the server, never by a timer: a change to this flow reloads the
  // list, and one to the record on screen reloads the record too.
  useLifecycleChanges((change) => {
    if (change && change.lifecycle !== flow) return;
    void list.reload();
    if (!change || change.recordId === selected) void reloadRecord();
  });
  // Except while an effect is still under way, which says nothing when done.
  useFollowUp(lifecycle.view, reloadRecord);

  return (
    <PageContainer>
      <PageHeader
        title={t(`${flow}.title`)}
        description={props.description(list.data?.parameters ?? {})}
      />
      <ExampleGuide page={flow} />

      <div className='grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_1fr]'>
        <Card className='self-start'>
          <CardContent className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <h2 className='font-medium'>{t(`${flow}.list`)}</h2>
              <Button
                size='sm'
                onClick={() => {
                  setCreating(true);
                  setSelected(undefined);
                }}
              >
                <Plus />
                {t(`${flow}.new`)}
              </Button>
            </div>
            {list.error ? (
              <p className='text-sm text-destructive'>{list.error}</p>
            ) : null}
            <ul className='-mx-2 space-y-0.5'>
              {records.map((record) => {
                const id = text(record.id);
                return (
                  <li key={id}>
                    <button
                      type='button'
                      onClick={() => {
                        setSelected(id);
                        setCreating(false);
                      }}
                      className={cn(
                        'w-full rounded-md px-2 py-2 text-left hover:bg-muted',
                        selected === id && 'bg-muted',
                      )}
                    >
                      <div className='flex items-center gap-2'>
                        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                          {props.title(record)}
                        </span>
                        <StateBadge state={text(record.status)} />
                      </div>
                      <div className='mt-1 truncate text-xs text-muted-foreground'>
                        #{id} · {props.subtitle(record)} ·{' '}
                        {ago(record.statusChangedAt, i18n.language, now)}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {list.data && !records.length ? (
              <p className='py-6 text-center text-sm text-muted-foreground'>
                {t(`${flow}.empty`)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className='min-w-0 space-y-4'>
          {creating ? (
            <props.Form
              onCancel={() => setCreating(false)}
              onCreated={async (id) => {
                setCreating(false);
                setSelected(id);
                await list.reload();
              }}
            />
          ) : detail ? (
            <>
              <RecordCard
                {...props}
                detail={detail}
                fire={lifecycle.fire}
                now={now}
                revision={revision}
                reload={reload}
              />
              <props.Outside
                detail={detail}
                now={now}
                revision={revision}
                reload={reload}
              />
              <ProcessCard detail={detail} />
              {/* The process card above draws the lifecycle already. */}
              <LifecyclePanel
                detail={detail}
                actions={lifecycle}
                onChange={reload}
                diagram={false}
              />
            </>
          ) : (
            <>
              <Card>
                <CardContent className='py-12 text-center text-sm text-muted-foreground'>
                  {loadError || t(`${flow}.pick`)}
                </CardContent>
              </Card>
              <ProcessOverview
                flow={flow}
                diagram={lifecycle.description?.diagram}
              />
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

/** The record, its banner and the actions the persona may take on it. */
function RecordCard({
  flow,
  detail,
  fire,
  now,
  reload,
  title,
  fields,
  banner,
  destructive = [],
}: FlowPageProps &
  FlowDetailProps & {
    readonly fire: (transition: string) => Promise<unknown>;
  }): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const translate = useTranslate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const record = detail.record;
  const state = text(record.status);
  const shown = banner(detail, now);
  const final =
    detail.description.stateInfo.find((info) => info.name === state)?.final ===
    true;
  // The flow's own wording first, then the shared one, then the definition's title.
  const actionLabel = (name: string, title: string): string =>
    t(`${flow}.actions.${name}`, {
      defaultValue: t(`transitions.${name}`, { defaultValue: title }),
    });
  const blocked = detail.available.filter(
    (item) =>
      !item.allowed &&
      // Who may not is said once, by the persona switch; what the record
      // still needs is worth saying.
      item.blockers.some((blocker) => blocker.kind === 'precondition'),
  );

  const act = async (name: string): Promise<void> => {
    setBusy(true);
    setError('');
    try {
      await fire(name);
      await reload();
    } catch (cause) {
      setError(errorMessage(cause, translate));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            #{text(record.id)}
          </span>
          <h2 className='min-w-0 flex-1 text-lg font-medium'>
            {title(record)}
          </h2>
          <StateBadge state={state} />
        </div>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4'>
          {fields(detail).map((field) => (
            <Field key={field.label} label={field.label}>
              {field.value}
            </Field>
          ))}
        </div>
        {shown ? <Banner tone={shown.tone}>{shown.text}</Banner> : null}
        <div className='flex flex-wrap items-center justify-end gap-2 border-t pt-4'>
          {detail.available
            .filter((item) => item.allowed)
            .map((item) => (
              <Button
                key={item.name}
                disabled={busy}
                variant={
                  destructive.includes(item.name) ? 'destructive' : 'default'
                }
                onClick={() => void act(item.name)}
              >
                {actionLabel(item.name, item.title)}
              </Button>
            ))}
          {!detail.available.some((item) => item.allowed) ? (
            <span className='text-sm text-muted-foreground'>
              {final
                ? t('flows.final')
                : t(`${flow}.nothing`, { defaultValue: t('flows.nothing') })}
            </span>
          ) : null}
        </div>
        {blocked.length ? (
          <ul className='space-y-0.5 text-right text-xs text-muted-foreground'>
            {blocked.map((item) => (
              <li key={item.name}>
                {actionLabel(item.name, item.title)}
                {': '}
                {item.blockers
                  .map((blocker) => blockerMessage(blocker, translate))
                  .join(' ')}
              </li>
            ))}
          </ul>
        ) : null}
        {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      </CardContent>
    </Card>
  );
}

/** The lifecycle drawn with where this record is and where it has been. */
function ProcessCard({
  detail,
}: {
  readonly detail: RecordDetail;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('flows.process')}</CardTitle>
        <CardDescription>{t('flows.legend')}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-2'>
        <FlowDiagram
          diagram={detail.diagram}
          current={text(detail.record.status)}
          visited={visitedStates(detail)}
        />
        <DiagramSource diagram={detail.diagram} />
      </CardContent>
    </Card>
  );
}

/** Before a record is picked: the whole process, and what it shows. */
function ProcessOverview({
  flow,
  diagram,
}: {
  readonly flow: DurableFlow;
  readonly diagram: string | undefined;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('flows.process')}</CardTitle>
        <CardDescription>{t(`${flow}.shows`)}</CardDescription>
      </CardHeader>
      <CardContent>
        {diagram ? <FlowDiagram diagram={diagram} /> : null}
      </CardContent>
    </Card>
  );
}

/** A labelled block inside an outside-world card. */
export function Section({
  title,
  hint,
  children,
}: {
  readonly title: ReactNode;
  readonly hint?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className='space-y-2'>
      <div>
        <h3 className='text-sm font-medium'>{title}</h3>
        {hint ? <p className='text-xs text-muted-foreground'>{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** The card that plays the systems outside the application. */
export function OutsideCard({
  title,
  description,
  children,
}: {
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Card className='border-dashed'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>{children}</CardContent>
    </Card>
  );
}
