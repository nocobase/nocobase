import { useToaster } from '@nocobase/app-client';
import { DefaultAgentPreference } from '@nocobase/app-plugin-agents/client/profile';
import { useAppLocale } from '@nocobase/app-plugin-i18n/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ReactElement } from 'react';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import { isThemeMode, isThemePreset } from '../../account/preferences-sync.js';
import { useGitStatus } from '../../git/api.js';
import { AttributionPreferenceField } from '../../git/attribution.js';
import { playInboxChime, useInboxChime } from '../../inbox/chime.js';
import { useThemePreset } from '../../theme/theme-context.js';
import { themePresets } from '../../theme/theme-presets.js';

const MODES = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
] as const;

/**
 * `/account/preferences`: the person's language, theme, density, inbox sound, default chat agent and, while the
 * workspace has a connection to a code host, how their agents' commits are attributed. Each is kept on
 * the server with their account (`account/preferences-sync.ts`, `inbox/chime.ts`, the agents plugin's chat
 * preferences), so it follows them to every browser; the account menu's Language and Theme submenus change the same
 * values.
 */
export default function AccountPreferences(): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const { locale, locales, setLocale, switching } = useAppLocale();
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();
  const chime = useInboxChime();
  const git = useGitStatus().data;

  function changeLocale(value: string): void {
    if (value === locale) return;
    setLocale(value).then(
      (result) => {
        if (result.fallback)
          toaster.show({
            type: 'info',
            title: t('notices.serverLocaleFallback', { lng: value }),
          });
      },
      () =>
        toaster.show({
          type: 'error',
          title: t('notices.languageChangeFailed', { lng: value }),
        }),
    );
  }

  return (
    <FieldGroup>
      <FieldSet>
        <FieldLegend>{t('preferences.display.title')}</FieldLegend>
        <FieldDescription>
          {t('preferences.display.description')}
        </FieldDescription>
        <FieldGroup>
          {locales.length > 1 ? (
            <Field>
              <FieldLabel htmlFor='studio-preference-locale'>
                {t('preferences.language')}
              </FieldLabel>
              <NativeSelect
                id='studio-preference-locale'
                className='w-full sm:w-64'
                value={locale}
                disabled={switching}
                onChange={(event) => changeLocale(event.target.value)}
              >
                {locales.map((definition) => (
                  <NativeSelectOption
                    key={definition.locale}
                    value={definition.locale}
                  >
                    {definition.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          ) : null}
          <Field>
            <FieldLabel id='studio-preference-mode'>
              {t('appearance.mode')}
            </FieldLabel>
            <ToggleGroup
              aria-labelledby='studio-preference-mode'
              variant='outline'
              value={theme ? [theme] : []}
              onValueChange={(value: readonly string[]) => {
                const next = value[0];
                if (isThemeMode(next)) setTheme(next);
              }}
              className='flex-wrap'
            >
              {MODES.map(({ id, icon: Icon }) => (
                <ToggleGroupItem key={id} value={id} className='gap-1.5'>
                  <Icon aria-hidden='true' className='size-4' />
                  {t(`appearance.${id}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor='studio-preference-preset'>
              {t('appearance.density')}
            </FieldLabel>
            <NativeSelect
              id='studio-preference-preset'
              className='w-full sm:w-64'
              value={preset}
              onChange={(event) => {
                if (isThemePreset(event.target.value))
                  setPreset(event.target.value);
              }}
            >
              {themePresets.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {t(item.labelKey)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </FieldGroup>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend>{t('preferences.sounds.title')}</FieldLegend>
        <FieldDescription>
          {t('preferences.sounds.description')}
        </FieldDescription>
        <Field orientation='horizontal'>
          <FieldContent>
            <FieldLabel htmlFor='studio-preference-chime'>
              {t('preferences.chime')}
            </FieldLabel>
            <FieldDescription>{t('inbox.chime.hint')}</FieldDescription>
          </FieldContent>
          <Switch
            id='studio-preference-chime'
            checked={chime.enabled}
            onCheckedChange={(checked) => {
              chime.setEnabled(checked);
              if (checked) playInboxChime({ preview: true });
            }}
          />
        </Field>
      </FieldSet>
      <FieldSeparator />
      <FieldSet>
        <FieldLegend>{t('preferences.agents.title')}</FieldLegend>
        <FieldDescription>
          {t('preferences.agents.description')}
        </FieldDescription>
        <DefaultAgentPreference />
        {git?.enabled ? (
          <div className='mt-4'>
            <AttributionPreferenceField />
          </div>
        ) : null}
      </FieldSet>
    </FieldGroup>
  );
}
