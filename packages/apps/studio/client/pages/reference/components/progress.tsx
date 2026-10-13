import { useTranslation } from '@nocobase/i18n/client';
import { PlayIcon, RotateCcwIcon } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';

import { ExamplePage, ExampleSection } from '../shared';

interface WarehouseProgress {
  readonly id: string;
  readonly name: string;
  readonly picked: number;
  readonly ordered: number;
}

const WAREHOUSES: readonly WarehouseProgress[] = [
  { id: 'oakland', name: 'Oakland, CA', picked: 184, ordered: 210 },
  { id: 'portland', name: 'Portland, OR', picked: 96, ordered: 150 },
  { id: 'newark', name: 'Newark, NJ', picked: 41, ordered: 168 },
];

const IMPORT_STEP = 4;
const IMPORT_INTERVAL_MS = 120;

export default function ProgressExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [imported, setImported] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => {
      setImported((value) => {
        const next = value + IMPORT_STEP;
        if (next >= 100) {
          setRunning(false);
          return 100;
        }
        return next;
      });
    }, IMPORT_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <ExamplePage
      title={t('components.progress.title')}
      description={t('components.progress.description')}
      docs='https://ui.shadcn.com/docs/components/progress'
    >
      <ExampleSection
        title={t('components.progress.basic')}
        description={t('components.progress.basicDescription')}
        contentClassName='block space-y-6'
      >
        <Progress value={25} className='w-full max-w-md' />
        <Progress value={60} className='w-full max-w-md' />
        <Progress value={100} className='w-full max-w-md' />
      </ExampleSection>

      <ExampleSection
        title={t('components.progress.label')}
        description={t('components.progress.labelDescription')}
        contentClassName='block'
      >
        <Progress value={72} className='w-full max-w-md'>
          <ProgressLabel>{t('components.progress.storageUsed')}</ProgressLabel>
          <ProgressValue />
        </Progress>
      </ExampleSection>

      <ExampleSection
        title={t('components.progress.running')}
        description={t('components.progress.runningDescription')}
        contentClassName='block space-y-4'
      >
        <Progress value={imported} className='w-full max-w-md'>
          <ProgressLabel>
            {t('components.progress.importLabel', { file: 'customers.csv' })}
          </ProgressLabel>
          <ProgressValue />
        </Progress>
        <p className='text-sm text-muted-foreground'>
          {imported === 100
            ? t('components.progress.importDone', { rows: 1_240 })
            : t('components.progress.importRunning', {
                rows: Math.round((imported / 100) * 1240),
                total: 1_240,
              })}
        </p>
        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            disabled={running || imported === 100}
            onClick={() => setRunning(true)}
          >
            <PlayIcon data-icon='inline-start' />
            {t('components.progress.startImport')}
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={imported === 0 && !running}
            onClick={() => {
              setRunning(false);
              setImported(0);
            }}
          >
            <RotateCcwIcon data-icon='inline-start' />
            {t('reference.reset')}
          </Button>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.progress.fulfilment')}
        description={t('components.progress.fulfilmentDescription')}
        contentClassName='block space-y-6'
      >
        {WAREHOUSES.map((warehouse) => (
          <Progress
            key={warehouse.id}
            value={Math.round((warehouse.picked / warehouse.ordered) * 100)}
            className='w-full max-w-md'
          >
            <ProgressLabel>{warehouse.name}</ProgressLabel>
            <ProgressValue
              render={(props) => (
                <span {...props}>
                  {t('components.progress.pickedOf', {
                    picked: warehouse.picked,
                    ordered: warehouse.ordered,
                  })}
                </span>
              )}
            />
          </Progress>
        ))}
      </ExampleSection>
    </ExamplePage>
  );
}
