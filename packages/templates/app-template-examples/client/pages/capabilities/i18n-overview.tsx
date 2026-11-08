import { useApiClient } from '@nocobase/app-client';
import { useAppLocale } from '@nocobase/app-plugin-i18n/client';
import {
  useI18nRuntime,
  useTranslation,
  type LocaleDefinition,
} from '@nocobase/i18n/client';
import { Languages, Globe, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '#components/ui/button';
import packageMetadata from '../../../package.json' with { type: 'json' };
import {
  CurrentApplication,
  ConfigurationItem,
  ConfigurationActions,
  ConfigurationAction,
} from './detail-layout.js';

const steps = {
  add: ['translate', 'declare', 'plugins', 'verify'],
  default: ['check', 'configure', 'verify', 'preference'],
} as const;

export default function I18nOverview() {
  const { t } = useTranslation(packageMetadata.name);
  const runtime = useI18nRuntime();
  const { locales } = useAppLocale();
  const api = useApiClient();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<
    { locales: readonly LocaleDefinition[] } | { error: true }
  >();
  useEffect(() => {
    let active = true;
    api
      .request<{ data: { locales: readonly LocaleDefinition[] } }>({
        path: 'i18n/locales',
      })
      .then(
        ({ data }) => {
          if (active)
            setResult(Array.isArray(data?.locales) ? data : { error: true });
        },
        () => {
          if (active) setResult({ error: true });
        },
      );
    return () => {
      active = false;
    };
  }, [api, attempt]);
  const server = result && 'locales' in result ? result.locales : undefined;
  const defaultLocale = runtime.getDefaultLocale();
  return (
    <div className='flex min-w-0 flex-col gap-6'>
      <CurrentApplication
        footer={
          result && 'error' in result ? (
            <div className='flex flex-wrap items-center gap-3'>
              <p role='alert'>{t('featureOverview.layout.messageUnknown')}</p>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  setResult(undefined);
                  setAttempt((value) => value + 1);
                }}
              >
                {t('featureOverview.refresh')}
              </Button>
            </div>
          ) : undefined
        }
      >
        <ConfigurationItem
          title={t('featureOverview.layout.languagesTitle')}
          description={t('featureOverview.layout.languagesDescription', {
            languages: locales.map((item) => item.label).join('、'),
          })}
          state={locales.length > 0}
          icon={Languages}
        />
        <ConfigurationItem
          title={t('featureOverview.layout.languageSwitchTitle')}
          description={t('featureOverview.layout.languageSwitchDescription')}
          state={locales.length > 1}
          icon={Globe}
        />
        <ConfigurationItem
          title={t('featureOverview.layout.languageDefaultTitle')}
          description={t('featureOverview.layout.languageDefaultDescription', {
            language:
              locales.find((item) => item.locale === defaultLocale)?.label ??
              defaultLocale,
          })}
          state={locales.some((item) => item.locale === defaultLocale)}
          icon={Languages}
        />
        <ConfigurationItem
          title={t('featureOverview.layout.messageLanguages')}
          description={
            server ? server.map((item) => item.label).join('、') : undefined
          }
          state={!result ? 'loading' : server ? server.length > 0 : undefined}
          icon={MessageSquare}
        />
      </CurrentApplication>
      <ConfigurationActions>
        {(['add', 'default'] as const).map((goal) => (
          <ConfigurationAction
            key={goal}
            title={t(`i18nOverview.${goal}.title`)}
            description={t(
              `featureOverview.layout.${goal === 'add' ? 'addLanguageDescription' : 'defaultLanguageDescription'}`,
            )}
            prompt={t(`i18nOverview.${goal}.prompt`)}
            steps={steps[goal].map((key) =>
              t(`i18nOverview.${goal}.steps.${key}`),
            )}
          />
        ))}
      </ConfigurationActions>
    </div>
  );
}
