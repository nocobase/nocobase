import { useTranslation } from '@nocobase/i18n/client';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { ReactElement } from 'react';

import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

import { isThemeMode, isThemePreset } from '../../account/preferences-sync.js';
import { useThemePreset } from '../../theme/theme-context.js';
import { themePresets } from '../../theme/theme-presets.js';

const MODES = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
] as const;

/**
 * Account-menu theme choices: the color mode and the theme preset, the same values the Preferences page
 * (`pages/account/preferences.tsx`) changes and keeps with the account (`account/preferences-sync.ts`).
 */
export function ThemeSwitcher(): ReactElement {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();
  const current = MODES.find((mode) => mode.id === theme);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className='gap-2'>
        <Palette aria-hidden='true' className='size-4' />
        <span className='flex-1'>{t('appearance.menu')}</span>
        {current ? (
          <span className='text-muted-foreground'>
            {t(`appearance.${current.id}`)}
          </span>
        ) : null}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('appearance.mode')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value: unknown) => {
              if (isThemeMode(value)) setTheme(value);
            }}
          >
            {MODES.map(({ id, icon: Icon }) => (
              <DropdownMenuRadioItem key={id} value={id}>
                <Icon aria-hidden='true' />
                {t(`appearance.${id}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('appearance.density')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={preset}
            onValueChange={(value: unknown) => {
              if (isThemePreset(value)) setPreset(value);
            }}
          >
            {themePresets.map((item) => (
              <DropdownMenuRadioItem key={item.id} value={item.id}>
                {t(item.labelKey)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
