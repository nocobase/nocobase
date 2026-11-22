import { copyText, useToaster } from '@nocobase/app-client';
import { CopyIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { Button } from '../components/ui/button.js';
import { Spinner } from '../components/ui/spinner.js';
import { useAuthenticationSettings } from '../settings/data.js';
import { methodGuideSnippets, type MethodGuide } from './method-guides.js';
import { SettingsPage } from './shared.js';
import { useAuthenticationTranslation } from './i18n.js';

/**
 * The guide to turning on two-factor authentication or passkeys, laid out like the single sign-on guide: the steps
 * and the configuration to deploy. It explains and saves nothing.
 */
function MethodGuidePage({
  method,
}: {
  readonly method: MethodGuide;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const settings = useAuthenticationSettings();
  const toaster = useToaster();
  const publicOrigin = settings.data?.app.publicOrigin.value ?? null;
  const snippets = methodGuideSnippets(method, publicOrigin);
  const copy = (text: string): void => {
    void copyText(text).then((copied) => {
      if (copied) toaster.show({ type: 'success', title: t('sso.copied') });
    });
  };
  const all = [snippets.install, snippets.server, snippets.client]
    .filter(Boolean)
    .concat(snippets.migration)
    .join('\n\n');

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
      ) : (
        <div className='space-y-6 rounded-xl border bg-card p-4 sm:p-6'>
          <Step label={t('guide.plugins')}>
            <p className='mb-2 text-sm text-muted-foreground'>
              {t(`guide.${method}.pluginsDescription`)}
            </p>
            <div className='space-y-2'>
              {snippets.install ? (
                <Code
                  testId='guide-install'
                  onCopy={copy}
                  copyLabel={t('sso.copy')}
                >
                  {snippets.install}
                </Code>
              ) : null}
              <Code
                testId='guide-server'
                onCopy={copy}
                copyLabel={t('sso.copy')}
              >
                {snippets.server}
              </Code>
              <Code
                testId='guide-client'
                onCopy={copy}
                copyLabel={t('sso.copy')}
              >
                {snippets.client}
              </Code>
            </div>
            {method === 'passkey' && !publicOrigin ? (
              <Warning>{t('guide.passkey.publicOriginMissing')}</Warning>
            ) : null}
          </Step>
          <Step label={t('guide.migration')}>
            <p className='mb-2 text-sm text-muted-foreground'>
              {t('guide.migrationDescription')}
            </p>
            <Code
              testId='guide-migration'
              onCopy={copy}
              copyLabel={t('sso.copy')}
            >
              {snippets.migration}
            </Code>
          </Step>
          <Step label={t('guide.deploy')}>
            <p className='text-sm text-muted-foreground'>
              {t('guide.deployDescription')}
            </p>
          </Step>
          <Step label={t('guide.notes')}>
            <ul className='space-y-2'>
              {(['note1', 'note2', 'note3'] as const).map((note) => (
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
          </Step>
          <div className='flex flex-wrap justify-end gap-2 border-t pt-4'>
            <Button
              variant='outline'
              render={<Link to='..' relative='path' />}
              nativeButton={false}
            >
              {t('sso.back')}
            </Button>
            <Button onClick={() => copy(all)}>{t('sso.copyAll')}</Button>
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

function Code({
  children,
  testId,
  copyLabel,
  onCopy,
}: {
  readonly children: string;
  readonly testId: string;
  readonly copyLabel: string;
  readonly onCopy: (text: string) => void;
}): ReactElement {
  return (
    <div className='overflow-hidden rounded-lg bg-muted'>
      <div className='flex justify-end px-1.5 pt-1.5'>
        <Button size='sm' variant='outline' onClick={() => onCopy(children)}>
          <CopyIcon aria-hidden />
          {copyLabel}
        </Button>
      </div>
      <pre
        className='overflow-x-auto px-3 pt-1 pb-2 text-xs leading-5'
        data-testid={testId}
      >
        {children}
      </pre>
    </div>
  );
}

function Warning({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <p className='mt-2 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200'>
      <TriangleAlertIcon className='mt-0.5 size-3.5 shrink-0' aria-hidden />
      {children}
    </p>
  );
}

function Step({
  label,
  children,
}: {
  readonly label: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4'>
      <div className='pt-1.5 text-sm font-semibold'>{label}</div>
      <div className='min-w-0'>{children}</div>
    </div>
  );
}
