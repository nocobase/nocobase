import {
  copyText,
  useClientApplication,
  useToaster,
} from '@nocobase/app-client';
import { CopyIcon } from 'lucide-react';
import { useId, useState, type ReactElement } from 'react';
import { Link, useSearchParams } from 'react-router';

import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group.js';
import { Spinner } from '../components/ui/spinner.js';
import { useAuthenticationSettings } from '../settings/data.js';
import { guideContext, providerPrompt } from './agent-prompts.js';
import { useAuthenticationTranslation } from './i18n.js';
import { PromptBox } from './prompt-box.js';
import { ssoCallbackUrl, variablePrefix } from './sso-config.js';
import {
  GuideStep,
  PublicOriginWarning,
  SettingsLoadError,
  SettingsPage,
} from './shared.js';

interface Preset {
  readonly id: string;
  readonly name: string;
  readonly discoveryUrl?: string;
  /** "Other": the name follows the identifier the administrator types. */
  readonly other?: true;
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
  { id: 'oidc', name: 'OIDC', other: true },
];

const SOCIAL_PRESETS: readonly Preset[] = [
  { id: 'github', name: 'GitHub' },
  { id: 'google', name: 'Google' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'apple', name: 'Apple' },
  { id: 'custom', name: 'Other', other: true },
];

/**
 * The guide to turning on single sign-on (OIDC) or a social provider. It builds the callback URL from
 * `app.publicOrigin` and a prompt for a development agent that follows the provider and first sign-in chosen here; it
 * saves nothing, and the client secret is never typed in.
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
  // A built-in social provider keeps Better Auth's own id: socialProviders accepts no other key. Only Other is free.
  const locked = type === 'social' && !preset.other;
  const id = locked ? preset.id : providerId.trim() || preset.id;
  const name = preset.other ? id : preset.name;
  const context = guideContext({
    configuredTitle: useClientApplication().config.get<unknown>('app.title'),
    documentTitle: document.title,
    publicOrigin: settings.data?.app.publicOrigin.value ?? null,
    browserOrigin: window.location.origin,
  });
  const authBase =
    settings.data?.app.authBaseUrl ??
    `${window.location.origin}${settings.data?.app.authBasePath ?? '/api/auth'}`;
  const callback = ssoCallbackUrl(authBase, id);
  const prefix = variablePrefix(id);
  // A provider outside Better Auth's built-in list cannot be a socialProviders key; it goes through genericOAuth().
  const promptType = type === 'social' && preset.other ? 'oauth' : type;
  // Built only from settings that were read: a failed read leaves nothing to copy.
  const prompt = settings.data
    ? providerPrompt(t, {
        type: promptType,
        id,
        name,
        discoveryUrl: preset.discoveryUrl,
        signUp,
        callbackUrl: callback,
        appName: context.appName,
        origin: context.origin,
      })
    : '';
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
      ) : settings.data === undefined ? (
        <SettingsLoadError onRetry={settings.refetch} />
      ) : (
        <div className='space-y-6 rounded-xl border bg-card p-4 sm:p-6'>
          <GuideStep label={t('sso.provider')}>
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
                  {item.other && type === 'social' ? t('sso.other') : item.name}
                </Button>
              ))}
            </div>
          </GuideStep>
          <GuideStep label={<Label htmlFor={fieldId}>{t('sso.id')}</Label>}>
            <Input
              id={fieldId}
              className='max-w-md read-only:cursor-default read-only:bg-muted read-only:text-muted-foreground'
              value={locked ? preset.id : providerId}
              readOnly={locked}
              aria-readonly={locked}
              onChange={(event) =>
                setProviderId(event.target.value.replace(/[^a-z0-9-]/giu, ''))
              }
            />
            <p className='mt-1 text-xs text-muted-foreground'>
              {locked ? t('sso.idLocked', { name }) : t('sso.idHint')}
            </p>
          </GuideStep>
          <GuideStep label={t('sso.createApp', { name })}>
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
            <p className='mt-1 text-xs text-muted-foreground'>
              {t('sso.callbackHint', { name })}
            </p>
            {context.originConfigured ? null : (
              <PublicOriginWarning>
                {t('sso.publicOriginMissing')}
              </PublicOriginWarning>
            )}
          </GuideStep>
          <GuideStep label={t('sso.firstSignIn')}>
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
                      {t(`sso.${option}Hint`, { name })}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </GuideStep>
          <GuideStep label={t('sso.handOver')}>
            <PromptBox prompt={prompt} hint={t('sso.promptHint')} />
          </GuideStep>
          <GuideStep label={t('sso.deploy')}>
            <p className='text-sm text-muted-foreground'>
              {t('sso.deployDescription', { prefix, name })}
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
