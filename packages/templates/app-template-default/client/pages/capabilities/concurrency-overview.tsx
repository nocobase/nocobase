import { useTranslation } from '@nocobase/i18n/client';
import { Info } from 'lucide-react';
import packageMetadata from '../../../package.json' with { type: 'json' };
import {
  CurrentApplication,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

const examples = {
  independent: `concurrency:
  default: memory
  memory:
    adapter: mutex
  reports:
    adapter: mutex
    namespace: my-app-reports`,
  default: `concurrency:
  default: reports`,
} as const;

export default function ConcurrencyOverview() {
  const { t } = useTranslation(packageMetadata.name);
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication
        footer={
          <p className='flex items-start gap-2'>
            <Info className='mt-0.5 size-4 shrink-0' aria-hidden />
            <span>{t('concurrencyOverview.current.unavailable')}</span>
          </p>
        }
      >
        <dl className='divide-y'>
          {(['default', 'adapter', 'scope', 'namespace', 'named'] as const).map(
            (key) => (
              <div
                key={key}
                className='flex items-start justify-between gap-6 py-3.5 text-sm'
              >
                <dt className='font-medium'>
                  {t(`concurrencyOverview.current.${key}`)}
                </dt>
                <dd className='text-right text-muted-foreground'>
                  {t('concurrencyOverview.current.unknown')}
                </dd>
              </div>
            ),
          )}
        </dl>
      </CurrentApplication>
      <ConfigurationActions title={t('concurrencyOverview.actionsTitle')}>
        {(['distributed', 'independent', 'default'] as const).map((action) => (
          <ConfigurationAction
            key={action}
            title={t(`concurrencyOverview.actions.${action}.title`)}
            description={t(`concurrencyOverview.actions.${action}.description`)}
            prompt={t(`concurrencyOverview.actions.${action}.prompt`)}
            steps={(['inspect', 'configure', 'apply'] as const).map((step) =>
              t(`concurrencyOverview.actions.${action}.${step}`),
            )}
            configuration={
              <div className='space-y-3'>
                {action !== 'distributed' ? (
                  <h4 className='text-sm font-medium'>
                    {t('concurrencyOverview.exampleTitle')}
                  </h4>
                ) : null}
                <p className='text-sm leading-6 text-muted-foreground'>
                  {t(`concurrencyOverview.actions.${action}.note`)}
                </p>
                {action !== 'distributed' ? (
                  <>
                    <pre className='overflow-x-auto rounded-md bg-muted p-3 text-xs leading-6'>
                      <code>{examples[action]}</code>
                    </pre>
                    <p className='text-xs leading-5 text-muted-foreground'>
                      {t('concurrencyOverview.exampleHint')}
                    </p>
                  </>
                ) : null}
              </div>
            }
          />
        ))}
      </ConfigurationActions>
    </div>
  );
}
