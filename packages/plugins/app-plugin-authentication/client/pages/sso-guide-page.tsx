import { copyText, useToaster } from '@nocobase/app-client';
import { CopyIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';
import { useId, useState, type ReactElement, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';

import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.js';
import { Spinner } from '../components/ui/spinner.js';
import { useAuthenticationSettings } from '../settings/data.js';
import { ssoCallbackUrl, ssoConfig, variablePrefix } from './sso-config.js';
import { SettingsPage } from './shared.js';
import { useAuthenticationTranslation } from './i18n.js';

interface Preset {
  readonly id: string;
  readonly name: string;
  readonly discoveryUrl?: string;
}

const OIDC_PRESETS: readonly Preset[] = [
  { id: 'feishu', name: 'Feishu' },
  { id: 'dingtalk', name: 'DingTalk' },
  { id: 'wecom', name: 'WeCom' },
  {
    id: 'okta',
    name: 'Okta',
    discoveryUrl: 'https://<okta-domain>/.well-known/openid-configuration',
  },
  {
    id: 'entra',
    name: 'Microsoft Entra ID',
    discoveryUrl:
      'https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration',
  },
  { id: 'oidc', name: 'OIDC' },
];

const SOCIAL_PRESETS: readonly Preset[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'google', name: 'Google' },
  { id: 'microsoft', name: 'Microsoft' },
];

/**
 * The guide to turning on single sign-on (OIDC) or a social provider. It builds the callback URL from
 * `app.publicOrigin` and the configuration snippet to deploy; it saves nothing, and the client secret is never typed in.
 */
export default function SsoGuidePage(): ReactElement {
  const { t } = useAuthenticationTranslation();
  const settings = useAuthenticationSettings();
  const [params] = useSearchParams();
  const type = params.get('type') === 'social' ? 'social' : 'sso';
  const presets = type === 'social' ? SOCIAL_PRESETS : OIDC_PRESETS;
  const [preset, setPreset] = useState<Preset>(presets[0]);
  const [providerId, setProviderId] = useState(presets[0].id);
  const [signUp, setSignUp] = useState<'create' | 'existing'>('create');
  const fieldId = useId();
  const toaster = useToaster();

  const choose = (next: Preset): void => {
    setPreset(next);
    setProviderId(next.id);
  };
  const id = providerId.trim() || preset.id;
  const authBase =
    settings.data?.app.authBaseUrl ??
    `${window.location.origin}${settings.data?.app.authBasePath ?? '/api/auth'}`;
  const callback = ssoCallbackUrl(authBase, id);
  const prefix = variablePrefix(id);
  const config = ssoConfig({
    type,
    id,
    discoveryUrl: preset.discoveryUrl,
    signUp,
  });
  const copy = (text: string): void => {
    void copyText(text).then((copied) => {
      if (copied) toaster.show({ type: 'success', title: t('sso.copied') });
    });
  };

  return (
    <SettingsPage
      eyebrow={
        <Link to='..' relative='path' className='hover:underline'>
          {t('settings.title')}
        </Link>
      }
      title={type === 'social' ? t('sso.socialTitle') : t('sso.title')}
      description={t('sso.description')}
    >
      {settings.isPending ? (
        <div className='flex justify-center py-12'>
          <Spinner />
        </div>
      ) : (
        <div className='space-y-6 rounded-xl border bg-card p-4 sm:p-6'>
          <Step label={t('sso.provider')}>
            <div
              className='flex flex-wrap gap-2'
              role='group'
              aria-label={t('sso.provider')}
            >
              {presets.map((item) => (
                <Button
                  key={item.id}
                  size='sm'
                  variant={item.id === preset.id ? 'default' : 'outline'}
                  aria-pressed={item.id === preset.id}
                  onClick={() => choose(item)}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </Step>
          <Step label={<Label htmlFor={fieldId}>{t('sso.id')}</Label>}>
            <Input
              id={fieldId}
              className='max-w-md'
              value={providerId}
              onChange={(event) =>
                setProviderId(event.target.value.replace(/[^a-z0-9-]/giu, ''))
              }
            />
            <p className='mt-1 text-xs text-muted-foreground'>
              {t('sso.idHint')}
            </p>
          </Step>
          <Step label={t('sso.callback')}>
            <div className='flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100'>
              <span
                className='min-w-0 flex-1 break-all'
                data-testid='sso-callback'
              >
                {callback}
              </span>
              <Button
                size='sm'
                variant='outline'
                className='text-foreground'
                onClick={() => copy(callback)}
              >
                <CopyIcon aria-hidden />
                {t('sso.copy')}
              </Button>
            </div>
            {settings.data?.app.authBaseUrl ? (
              <p className='mt-1 text-xs text-muted-foreground'>
                {t('sso.callbackHint', { name: preset.name })}
              </p>
            ) : (
              <p className='mt-2 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200'>
                <TriangleAlertIcon
                  className='mt-0.5 size-3.5 shrink-0'
                  aria-hidden
                />
                {t('sso.publicOriginMissing')}
              </p>
            )}
          </Step>
          <Step label={t('sso.firstSignIn')}>
            <RadioGroup
              value={signUp}
              onValueChange={(value) =>
                setSignUp(value as 'create' | 'existing')
              }
              className='max-w-2xl'
            >
              {(['create', 'existing'] as const).map((option) => (
                <label
                  key={option}
                  className='flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5'
                >
                  <RadioGroupItem value={option} className='mt-0.5' />
                  <span>
                    <span className='block text-sm font-medium'>
                      {t(`sso.${option}`)}
                    </span>
                    <span className='block text-xs text-muted-foreground'>
                      {t(`sso.${option}Hint`, { name: preset.name })}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </Step>
          <Step label={t('sso.mapping')}>
            <p className='flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm'>
              <InfoIcon
                className='mt-0.5 size-4 shrink-0 text-primary'
                aria-hidden
              />
              {t('sso.mappingDescription', { name: preset.name })}
            </p>
          </Step>
          <Step label={t('sso.config')}>
            <pre
              className='overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs leading-5'
              data-testid='sso-config'
            >
              {config}
            </pre>
            <p className='mt-1 text-xs text-muted-foreground'>
              {t('sso.configHint', { prefix })}
            </p>
          </Step>
          <Step label={t('sso.after')}>
            <p className='text-sm text-muted-foreground'>
              {t('sso.afterDescription')}
            </p>
          </Step>
          <div className='flex flex-wrap justify-end gap-2 border-t pt-4'>
            <Button
              variant='outline'
              render={<Link to='..' relative='path' />}
              nativeButton={false}
            >
              {t('sso.back')}
            </Button>
            <Button onClick={() => copy(`${callback}\n\n${config}`)}>
              {t('sso.copyAll')}
            </Button>
          </div>
        </div>
      )}
    </SettingsPage>
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
