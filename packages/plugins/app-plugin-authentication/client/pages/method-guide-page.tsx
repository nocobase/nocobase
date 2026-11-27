import { InfoIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { Button } from '../components/ui/button.js';
import { Spinner } from '../components/ui/spinner.js';
import { useAuthenticationSettings } from '../settings/data.js';
import { useClientApplication } from '@nocobase/app-client';

import {
  guideContext,
  methodPrompt,
  type MethodGuide,
} from './agent-prompts.js';
import { useAuthenticationTranslation } from './i18n.js';
import { PromptBox } from './prompt-box.js';
import {
  GuideStep,
  PublicOriginWarning,
  SettingsLoadError,
  SettingsPage,
} from './shared.js';

const NOTES: Record<MethodGuide, readonly string[]> = {
  twoFactor: ['note1'],
  passkey: ['note1', 'note2'],
};

/**
 * The guide to turning on two-factor authentication or passkeys: a prompt for a development agent, filled in from this
 * application's configuration, and what to expect once it is deployed. It saves nothing.
 */
function MethodGuidePage({
  method,
}: {
  readonly method: MethodGuide;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const settings = useAuthenticationSettings();
  const context = guideContext({
    configuredTitle: useClientApplication().config.get<unknown>('app.title'),
    documentTitle: document.title,
    publicOrigin: settings.data?.app.publicOrigin.value ?? null,
    browserOrigin: window.location.origin,
  });
  // Built only from settings that were read: a failed read leaves nothing to copy.
  const prompt = settings.data
    ? methodPrompt(t, {
        method,
        appName: context.appName,
        origin: context.origin,
      })
    : '';

  return (
    <SettingsPage
      eyebrow={
        <Link to='..' relative='path' className='hover:underline'>
          {t('settings.title')}
        </Link>
      }
      title={t(`guide.${method}.title`)}
      description={t(`guide.${method}.description`)}
    >
      {settings.isPending ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : settings.data === undefined ? (
        <SettingsLoadError onRetry={settings.refetch} />
      ) : (
        <div className='space-y-6 rounded-xl border bg-card p-4 sm:p-6'>
          <GuideStep label={t('guide.handOver')}>
            <PromptBox prompt={prompt} hint={t('guide.promptHint')} />
            {context.originConfigured ? null : (
              <PublicOriginWarning>
                {t('guide.publicOriginMissing', { origin: context.origin })}
              </PublicOriginWarning>
            )}
          </GuideStep>
          <GuideStep label={t('guide.notes')}>
            <ul className='space-y-2'>
              {NOTES[method].map((note) => (
                <li
                  key={note}
                  className='flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm'
                >
                  <InfoIcon
                    className='mt-0.5 size-4 shrink-0 text-primary'
                    aria-hidden
                  />
                  {t(`guide.${method}.${note}`)}
                </li>
              ))}
            </ul>
          </GuideStep>
          <GuideStep label={t('guide.after')}>
            <p className='text-sm text-muted-foreground'>
              {t(`guide.${method}.after`)}
            </p>
          </GuideStep>
          <div className='flex justify-end border-t pt-4'>
            <Button
              variant='outline'
              render={<Link to='..' relative='path' />}
              nativeButton={false}
            >
              {t('sso.back')}
            </Button>
          </div>
        </div>
      )}
    </SettingsPage>
  );
}

export function TwoFactorGuidePage(): ReactElement {
  return <MethodGuidePage method='twoFactor' />;
}

export function PasskeyGuidePage(): ReactElement {
  return <MethodGuidePage method='passkey' />;
}
