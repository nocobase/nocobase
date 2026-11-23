/**
 * The Configuration tab, read-only: one sentence on whether Schedules can run on several instances, the jobs
 * configuration they run on with each setting's value, effect and source, how to switch to Redis, and the Schedules
 * still active in the database that this instance's code no longer defines, with the command that cleans them up.
 */
import { useLocale } from '@nocobase/i18n/client';
import {
  ChevronRightIcon,
  CircleCheckIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../components/ui/collapsible.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import type { ConfigSource, JobsDescription } from '../../lib/api.js';
import { formatTime } from '../../lib/format.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import { Code, CommandBlock, Notes, Rich, StatusTag, Tag } from './parts.js';

export const FINALIZE_COMMAND =
  'node dist/cli/index.js scheduler sync --finalize';

const REDIS_SNIPPET = `jobs:
  backends:
    redis:
      adapter: redis
      # Connection options: see the README of @nocobase/app-plugin-jobs-redis
      concurrency: 1
      attempts: 1
scheduler:
  jobs: redis`;

interface Row {
  readonly key: string;
  readonly label: string;
  readonly value: ReactNode;
  readonly effect: ReactNode;
  readonly source: ReactNode;
}

export function ConfigTab({
  jobs,
}: {
  readonly jobs: JobsDescription | undefined;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  if (!jobs)
    return (
      <p className='text-sm text-muted-foreground'>{t('page.loadFailed')}</p>
    );
  const source = (value: ConfigSource | undefined) => (
    <Tag tone='muted'>{t(`config.sources.${value ?? 'default'}`)}</Tag>
  );
  const memory = !jobs.multiInstance;
  const rows: Row[] = [
    {
      key: 'configuration',
      label: t('config.rows.configuration'),
      value: (
        <span className='font-medium'>
          {jobs.configuration ?? t('config.builtIn')}
        </span>
      ),
      effect: (
        <Rich
          text={t(
            jobs.selectedBy === 'scheduler.jobs'
              ? 'config.selectedByScheduler'
              : jobs.selectedBy === 'jobs.default'
                ? 'config.selectedByDefault'
                : 'config.selectedByBuiltIn',
          )}
        />
      ),
      source: source(jobs.sources.configuration),
    },
    {
      key: 'backend',
      label: t('config.rows.backend'),
      value: (
        <span className='font-medium'>
          {memory ? t('config.memoryBackend') : jobs.adapter}
        </span>
      ),
      effect: memory ? (
        <Rich
          text={t('config.memoryEffect', {
            path: `\`${jobs.persistencePath ?? 'storage/jobs'}\``,
          })}
        />
      ) : (
        <span className='space-y-1'>
          <Rich text={t('config.sharedEffect', { adapter: jobs.adapter })} />
          <span className='block'>
            <Tag tone={jobs.pluginRegistered ? 'success' : 'danger'}>
              {t('config.plugin', {
                plugin: `@nocobase/app-plugin-jobs-${jobs.adapter}`,
              })}
            </Tag>
          </span>
        </span>
      ),
      source: source(jobs.sources.adapter),
    },
    {
      key: 'multiInstance',
      label: t('config.rows.multiInstance'),
      value: (
        <Tag tone={memory ? 'danger' : 'success'}>
          {t(memory ? 'config.unsupported' : 'config.supported')}
        </Tag>
      ),
      effect: t(memory ? 'config.multiUnsupported' : 'config.multiSupported'),
      source: (
        <span className='text-xs text-muted-foreground'>
          {t('config.sources.backend')}
        </span>
      ),
    },
    {
      key: 'concurrency',
      label: t('config.rows.concurrency'),
      value: <span className='font-medium'>{jobs.concurrency}</span>,
      effect: t('config.concurrencyEffect', { count: jobs.concurrency }),
      source: source(jobs.sources.concurrency),
    },
    {
      key: 'attempts',
      label: t('config.rows.attempts'),
      value: (
        <span className='inline-flex items-center gap-1.5 font-medium'>
          {jobs.attempts}
          <Tag tone={jobs.attempts === 1 ? 'success' : 'warning'}>
            {t(
              jobs.attempts === 1 ? 'config.attemptsOk' : 'config.attemptsWarn',
            )}
          </Tag>
        </span>
      ),
      effect: t(
        jobs.attempts === 1
          ? 'config.attemptsEffect'
          : 'config.attemptsWarnEffect',
      ),
      source: source(jobs.sources.attempts),
    },
    ...(memory
      ? []
      : [
          {
            key: 'connection',
            label: t('config.rows.connection'),
            value: (
              <Code>
                {jobs.connection
                  ? t('config.connectionValue', {
                      connection: jobs.connection,
                      namespace: jobs.namespace,
                    })
                  : t('config.namespaceOnly', { namespace: jobs.namespace })}
              </Code>
            ),
            effect: t('config.connectionEffect'),
            source: source(jobs.sources.connection ?? jobs.sources.namespace),
          },
        ]),
  ];
  return (
    <div className='space-y-6'>
      <Alert
        className={
          memory
            ? 'border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200'
            : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200'
        }
      >
        {memory ? <TriangleAlertIcon /> : <CircleCheckIcon />}
        <AlertTitle>
          {memory
            ? t('config.memory')
            : t('config.shared', { adapter: jobs.adapter })}
        </AlertTitle>
        {memory ? (
          <AlertDescription className='text-amber-900/90 dark:text-amber-200/90'>
            {t('config.memoryHint')}
          </AlertDescription>
        ) : null}
      </Alert>
      <div className='overflow-hidden rounded-xl border'>
        <div className='hidden md:block'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='pl-4'>
                  {t('config.columns.setting')}
                </TableHead>
                <TableHead>{t('config.columns.value')}</TableHead>
                <TableHead>{t('config.columns.effect')}</TableHead>
                <TableHead className='pr-4'>
                  {t('config.columns.source')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className='pl-4 font-medium'>
                    {row.label}
                  </TableCell>
                  <TableCell>{row.value}</TableCell>
                  <TableCell className='text-xs whitespace-normal text-muted-foreground'>
                    {row.effect}
                  </TableCell>
                  <TableCell className='pr-4'>{row.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ul className='divide-y md:hidden'>
          {rows.map((row) => (
            <li key={row.key} className='space-y-1.5 p-4'>
              <div className='flex items-center justify-between gap-2'>
                <span className='text-sm font-medium'>{row.label}</span>
                {row.source}
              </div>
              <div className='text-sm'>{row.value}</div>
              <div className='text-xs text-muted-foreground'>{row.effect}</div>
            </li>
          ))}
        </ul>
        <RedisGuide />
      </div>
      <RemovedFromCode jobs={jobs} />
      <Notes items={[t('config.readOnly')]} />
    </div>
  );
}

function RedisGuide(): ReactElement {
  const { t } = useSchedulerTranslation();
  return (
    <Collapsible className='border-t px-4 py-3'>
      <CollapsibleTrigger className='group flex items-center gap-1 text-sm text-primary'>
        <ChevronRightIcon className='size-4 transition-transform group-data-[panel-open]:rotate-90' />
        {t('config.redis.title')}
      </CollapsibleTrigger>
      <CollapsibleContent className='space-y-3 pt-3 text-sm'>
        <ol className='list-decimal space-y-1 pl-5'>
          <li>
            <Rich text={t('config.redis.step1')} />
          </li>
          <li>
            <Rich text={t('config.redis.step2')} />
          </li>
          <li>
            <Rich text={t('config.redis.step3')} />
          </li>
        </ol>
        <pre className='overflow-x-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-50 dark:bg-zinc-800'>
          {REDIS_SNIPPET}
        </pre>
        <p className='text-xs text-amber-700 dark:text-amber-300'>
          {t('config.redis.warning')}
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RemovedFromCode({
  jobs,
}: {
  readonly jobs: JobsDescription;
}): ReactElement {
  const { t } = useSchedulerTranslation();
  const { locale } = useLocale();
  const removed = jobs.removedFromCode;
  return (
    <section className='space-y-3'>
      <h2 className='text-base font-semibold'>{t('config.removed.title')}</h2>
      {removed.length === 0 ? (
        <div className='flex items-start gap-2 rounded-xl border p-4 text-sm'>
          <CircleCheckIcon className='mt-0.5 size-4 shrink-0 text-emerald-600' />
          <div>
            <div className='font-medium'>{t('config.removed.consistent')}</div>
            <div className='text-xs text-muted-foreground'>
              {t('config.removed.consistentHint')}
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-4 rounded-xl border p-4'>
          <Alert className='border-amber-500/30 bg-amber-500/5 text-amber-900 dark:text-amber-200'>
            <TriangleAlertIcon />
            <AlertTitle>
              {t('config.removed.warning', { count: removed.length })}
            </AlertTitle>
            <AlertDescription className='text-amber-900/90 dark:text-amber-200/90'>
              {t('config.removed.warningHint')}
            </AlertDescription>
          </Alert>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('config.removed.columns.task')}</TableHead>
                <TableHead>{t('config.removed.columns.last')}</TableHead>
                <TableHead className='hidden md:table-cell'>
                  {t('config.removed.columns.after')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {removed.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className='whitespace-normal'>
                    <div className='font-medium'>{schedule.title}</div>
                    <Code>{schedule.key}</Code>
                  </TableCell>
                  <TableCell>
                    {schedule.lastRunAt ? (
                      <span className='inline-flex flex-wrap items-center gap-1.5'>
                        {formatTime(schedule.lastRunAt, locale)}
                        {schedule.lastRun ? (
                          <StatusTag status={schedule.lastRun.status} />
                        ) : null}
                      </span>
                    ) : (
                      t('config.removed.neverRan')
                    )}
                  </TableCell>
                  <TableCell className='hidden text-xs whitespace-normal text-muted-foreground md:table-cell'>
                    {t('config.removed.after')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>{t('config.removed.how')}</h3>
            <p className='text-xs text-muted-foreground'>
              {t('config.removed.howHint')}
            </p>
            <CommandBlock command={FINALIZE_COMMAND} />
            <Notes
              items={[t('config.removed.why'), t('config.removed.full')]}
            />
          </div>
        </div>
      )}
    </section>
  );
}
