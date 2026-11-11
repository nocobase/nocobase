import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '#components/ui/dropdown-menu';
import { useThemePreset } from './theme-context';
import { themePresets } from './theme-presets';

const COLOR_MODES = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
] as const;

/** Account-menu appearance choices; the existing providers own persistence. */
export function ThemeSettings(): ReactElement {
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();
  const { t } = useTranslation();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className='gap-2'>
        <Palette aria-hidden='true' className='size-4' />
        {t('appearance.title', { defaultValue: 'Theme' })}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className='min-w-44'>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(String(value))}
          aria-label={t('appearance.mode', { defaultValue: 'Color mode' })}
        >
          <DropdownMenuLabel>
            {t('appearance.mode', { defaultValue: 'Color mode' })}
          </DropdownMenuLabel>
          {COLOR_MODES.map(({ id: mode, icon: ModeIcon }) => (
            <DropdownMenuRadioItem key={mode} value={mode} closeOnClick={false}>
              <ModeIcon aria-hidden='true' className='size-4' />
              {t('appearance.' + mode, {
                defaultValue: mode[0].toUpperCase() + mode.slice(1),
              })}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={preset}
          onValueChange={(value) => {
            const selected = themePresets.find((item) => item.id === value);
            if (selected) setPreset(selected.id);
          }}
          aria-label={t('appearance.preset', { defaultValue: 'Theme' })}
        >
          <DropdownMenuLabel>
            {t('appearance.preset', { defaultValue: 'Theme' })}
          </DropdownMenuLabel>
          {themePresets.map((item) => (
            <DropdownMenuRadioItem
              key={item.id}
              value={item.id}
              closeOnClick={false}
            >
              {t(item.labelKey, {
                defaultValue:
                  item.id.charAt(0).toUpperCase() + item.id.slice(1),
              })}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
