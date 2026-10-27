import type { ReactElement } from 'react';

import type { DemoConfigurationView } from '../demo-configuration.js';
import { languageName, useT } from './context.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components.js';

const pad = (value: number) => String(value).padStart(2, '0');

/** Displays the deployment's daily reset schedule and the server's next-run preview. */
export function ScheduleCard({
  configuration,
}: {
  readonly configuration: DemoConfigurationView;
}): ReactElement {
  const t = useT();
  const { schedule, nextRun } = configuration;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('schedule.title')}</CardTitle>
        <CardDescription>{t('schedule.description')}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {schedule ? (
          <dl className='grid gap-4 rounded-lg border p-4 sm:grid-cols-2'>
            <div className='flex flex-col gap-2'>
              <dt className='text-sm font-medium'>{t('schedule.time')}</dt>
              <dd className='text-sm tabular-nums'>
                {pad(schedule.hour)}:{pad(schedule.minute)}
              </dd>
            </div>
            <div className='flex flex-col gap-2'>
              <dt className='text-sm font-medium'>{t('schedule.language')}</dt>
              <dd className='text-sm'>{languageName(schedule.language)}</dd>
            </div>
            <div className='flex flex-col gap-2 sm:col-span-2'>
              <dt className='text-sm font-medium'>{t('schedule.timezone')}</dt>
              <dd className='text-sm'>{schedule.timezone}</dd>
            </div>
          </dl>
        ) : null}
        {nextRun ? (
          <p className='text-sm text-muted-foreground'>
            {t('schedule.next', { time: new Date(nextRun).toLocaleString() })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
