import { useEffect, useState, type ReactElement } from 'react';
import {
  realtimeClientToken,
  useApiClient,
  useService,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import { LiveIndicator } from '../components/live-indicator.js';
import { PageContainer } from '../components/page-container.js';
import { PageHeader } from '../components/page-header.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import {
  errorMessage,
  INTERVAL_CHOICES,
  listScheduleRules,
  SCHEDULE_CHANGES_TOPIC,
  startScheduleRule,
  stopScheduleRule,
  type ScheduleRule,
  type ScheduleRuleState,
  type ScheduleRun,
} from '../lib/api.js';

const STATE_VARIANT: Record<
  ScheduleRuleState,
  'default' | 'secondary' | 'outline'
> = {
  active: 'default',
  ended: 'secondary',
  stopped: 'outline',
};

const OUTCOME_VARIANT: Record<
  ScheduleRun['outcome'],
  'secondary' | 'outline' | 'destructive'
> = {
  running: 'secondary',
  succeeded: 'outline',
  failed: 'destructive',
};

/** How many recent runs a card lists. */
const VISIBLE_RUNS = 5;

export default function SchedulesPage(): ReactElement {
  const { i18n, t } = useTranslation('@nocobase/app-plugin-jobs-example');
  const api = useApiClient();
  const realtime = useService(realtimeClientToken);
  const [rules, setRules] = useState<readonly ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load(): Promise<void> {
      try {
        const { rules: loaded } = await listScheduleRules(api);
        if (!active) return;
        setRules(loaded);
        setError('');
      } catch (cause) {
        if (active) setError(errorMessage(cause));
      } finally {
        if (active) setLoading(false);
      }
    }

    // A push names the changed rule and nothing more: the rules are shared by
    // the whole application, so they are read back through the signed-in
    // route. A burst of pushes — one firing starts and ends — reloads once.
    const reload = (): void => {
      clearTimeout(timer);
      timer = setTimeout(() => void load(), 150);
    };
    // Subscribing opens the WebSocket, and leaving the page unsubscribes.
    const unsubscribe = realtime.subscribe(SCHEDULE_CHANGES_TOPIC, reload);
    // Pushes are not replayed, so every (re)connection reloads.
    const stopOpen = realtime.onOpen(reload);
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
      stopOpen();
      unsubscribe();
    };
  }, [api, realtime]);

  useEffect(() => {
    // Only the countdowns move between pushes.
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function act(name: string, action: () => Promise<void>): Promise<void> {
    setPending(name);
    setError('');
    try {
      await action();
      // The push that follows reloads too; this shows the change at once.
      setRules((await listScheduleRules(api)).rules);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setPending(undefined);
    }
  }

  function formatTime(value: string): string {
    return new Intl.DateTimeFormat(i18n.language, {
      timeStyle: 'medium',
    }).format(new Date(value));
  }

  function describe(rule: ScheduleRule): string {
    const parts = [
      rule.options.every !== undefined
        ? t('schedules.every', { seconds: rule.options.every / 1000 })
        : t('schedules.cron', { cron: rule.options.cron ?? '' }),
    ];
    if (rule.options.limit !== undefined)
      parts.push(t('schedules.limit', { limit: rule.options.limit }));
    return parts.join(' · ');
  }

  function nextRun(rule: ScheduleRule): string {
    if (!rule.nextRunAt) return t('schedules.noNextRun');
    const seconds = Math.ceil((Date.parse(rule.nextRunAt) - now) / 1000);
    return seconds > 0
      ? t('schedules.nextRun', { seconds })
      : t('schedules.nextRunDue');
  }

  return (
    <PageContainer>
      <PageHeader
        title={t('schedules.title')}
        description={t('schedules.description')}
      />
      {error ? (
        <p role='alert' className='text-sm text-destructive'>
          {error}
        </p>
      ) : null}
      <section className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-base font-semibold'>
            {t('schedules.listTitle')}
          </h2>
          <LiveIndicator
            realtime={realtime}
            live={t('schedules.live')}
            offline={t('schedules.offline')}
          />
        </div>
        {loading ? (
          <div className='rounded-lg border p-12 text-center text-sm text-muted-foreground'>
            {t('schedules.loading')}
          </div>
        ) : (
          <ul
            aria-label={t('schedules.listTitle')}
            className='grid gap-4 lg:grid-cols-2'
          >
            {rules.map((rule) => (
              <li key={rule.name}>
                <Card size='sm' className='h-full'>
                  <CardHeader>
                    <div className='flex items-start justify-between gap-3'>
                      <CardTitle>{t(`schedules.rule.${rule.name}`)}</CardTitle>
                      <div className='flex items-center gap-1.5'>
                        {rule.builtIn ? (
                          <Badge variant='outline'>
                            {t('schedules.builtIn')}
                          </Badge>
                        ) : null}
                        <Badge variant={STATE_VARIANT[rule.state]}>
                          {t(`schedules.state.${rule.state}`)}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {t(`schedules.ruleDescription.${rule.name}`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      <span className='font-mono text-xs'>
                        {describe(rule)}
                      </span>
                      <span className='text-right text-muted-foreground tabular-nums'>
                        {nextRun(rule)}
                      </span>
                      <span className='col-span-2 text-xs text-muted-foreground'>
                        {t('schedules.firings', { count: rule.firings })}
                      </span>
                    </div>
                    {rule.builtIn ? null : (
                      <div className='flex flex-wrap items-center gap-2'>
                        {rule.name === 'interval'
                          ? INTERVAL_CHOICES.map((every) => (
                              <Button
                                key={every}
                                size='sm'
                                variant={
                                  rule.state === 'active' &&
                                  rule.options.every === every
                                    ? 'secondary'
                                    : 'outline'
                                }
                                disabled={pending === rule.name}
                                onClick={() =>
                                  void act(rule.name, () =>
                                    startScheduleRule(api, rule.name, every),
                                  )
                                }
                              >
                                {t('schedules.every', {
                                  seconds: every / 1000,
                                })}
                              </Button>
                            ))
                          : null}
                        <span className='ml-auto' />
                        {rule.state === 'active' ? (
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={pending === rule.name}
                            onClick={() =>
                              void act(rule.name, () =>
                                stopScheduleRule(api, rule.name),
                              )
                            }
                          >
                            {t('schedules.stop')}
                          </Button>
                        ) : (
                          <Button
                            size='sm'
                            disabled={pending === rule.name}
                            onClick={() =>
                              void act(rule.name, () =>
                                startScheduleRule(api, rule.name),
                              )
                            }
                          >
                            {t('schedules.start')}
                          </Button>
                        )}
                      </div>
                    )}
                    {rule.runs.length ? (
                      <ol className='divide-y rounded-lg border text-xs'>
                        {rule.runs.slice(0, VISIBLE_RUNS).map((run) => (
                          <li
                            key={run.jobId}
                            className='flex items-center justify-between gap-3 px-3 py-2'
                          >
                            <span className='tabular-nums'>
                              {formatTime(run.runAt)}
                            </span>
                            <span className='text-muted-foreground tabular-nums'>
                              {t('schedules.delay', {
                                ms: Math.max(
                                  0,
                                  Date.parse(run.runAt) -
                                    Date.parse(run.scheduledAt),
                                ),
                              })}
                            </span>
                            <Badge variant={OUTCOME_VARIANT[run.outcome]}>
                              {t(`schedules.outcome.${run.outcome}`)}
                            </Badge>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className='rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground'>
                        {t('schedules.noRuns')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageContainer>
  );
}
