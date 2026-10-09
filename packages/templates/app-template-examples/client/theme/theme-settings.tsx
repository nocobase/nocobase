import { Check, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from '@nocobase/i18n/client';
import { useId, type ReactElement } from 'react';
import { Button } from '#components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from '#components/ui/popover';
import { cn } from 'cn';
import { useThemePreset } from './theme-context';
import { themePresets } from './theme-presets';

const COLOR_MODES = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
] as const;

export function ThemeSettings(): ReactElement {
  const { theme, setTheme } = useTheme();
  const { preset, setPreset } = useThemePreset();
  const { t } = useTranslation();
  const id = useId();
  const title = t('appearance.title', { defaultValue: 'Appearance' });
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={0}
        render={
          <Button
            aria-label={title}
            size='icon'
            variant='outline'
            className='size-10 rounded-xl border-border/70 bg-background/60 hover:bg-accent/50'
          />
        }
      >
        <Palette aria-hidden='true' className='size-5' />
      </PopoverTrigger>
      {/* Keep the panel width independent of density; its content still uses theme tokens. */}
      <PopoverContent
        align='end'
        className='w-xs max-w-[calc(100vw-2rem)] gap-4 p-4'
      >
        <div className='flex items-center justify-between'>
          <PopoverTitle className='text-sm font-semibold text-foreground'>
            {title}
          </PopoverTitle>
        </div>

        <fieldset className='space-y-2'>
          <legend className='text-xs font-medium text-muted-foreground'>
            {t('appearance.mode', { defaultValue: 'Color mode' })}
          </legend>
          <div className='grid grid-cols-3 gap-1 rounded-lg bg-muted/70 p-1'>
            {COLOR_MODES.map(({ id: mode, icon: ModeIcon }) => {
              const isSelected = theme === mode;
              return (
                <label
                  key={mode}
                  className={cn(
                    'relative flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                    isSelected
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:bg-background/40 hover:text-foreground',
                  )}
                >
                  <input
                    type='radio'
                    name={id + '-mode'}
                    value={mode}
                    checked={isSelected}
                    onChange={() => setTheme(mode)}
                    className='sr-only'
                  />
                  <ModeIcon aria-hidden='true' className='size-3.5 shrink-0' />
                  <span className='whitespace-nowrap'>
                    {t('appearance.' + mode, {
                      defaultValue: mode[0].toUpperCase() + mode.slice(1),
                    })}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className='space-y-2'>
          <legend className='text-xs font-medium text-muted-foreground'>
            {t('appearance.preset', { defaultValue: 'Theme' })}
          </legend>
          <div className='grid grid-cols-2 gap-2.5'>
            {themePresets.map((item) => {
              const isSelected = preset === item.id;
              return (
                <label
                  key={item.id}
                  className={cn(
                    'group relative flex cursor-pointer flex-col rounded-xl border p-2 text-left transition-all select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                      : 'border-border/70 hover:border-border hover:bg-muted/30',
                  )}
                >
                  <input
                    type='radio'
                    name={id + '-preset'}
                    value={item.id}
                    checked={isSelected}
                    onChange={() => setPreset(item.id)}
                    className='sr-only'
                  />
                  <div className='mb-2 h-16 w-full'>
                    <div
                      aria-hidden='true'
                      data-theme={item.id}
                      className='theme-preview relative flex h-full overflow-hidden rounded-lg border border-border/80 bg-background shadow-2xs'
                    >
                      {/* Mini Sidebar */}
                      <div className='flex w-6 flex-col gap-1 border-r border-sidebar-border/50 bg-sidebar p-1'>
                        <div className='size-2 rounded-xs bg-sidebar-primary-foreground' />
                        <div className='h-1 w-full rounded-xs bg-sidebar-foreground/30' />
                        <div className='h-1 w-full rounded-xs bg-sidebar-foreground/20' />
                      </div>
                      {/* Mini Main Content Area */}
                      <div className='flex flex-1 flex-col p-1.5'>
                        <div className='mb-1 flex items-center justify-between border-b border-border/40 pb-1'>
                          <div className='h-1 w-7 rounded-xs bg-foreground/70' />
                          <div className='size-1.5 rounded-full bg-primary' />
                        </div>
                        <div className='flex flex-1 flex-col justify-between'>
                          <div className='h-1 w-full rounded-xs bg-muted' />
                          <div className='flex items-center justify-between pt-1'>
                            <div className='h-1 w-6 rounded-xs bg-muted' />
                            <div className='h-3 w-5 rounded-xs bg-primary shadow-xs' />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className='mt-auto flex min-h-5 items-center justify-between gap-2 px-0.5'>
                    <span
                      className={cn(
                        'text-xs transition-colors',
                        isSelected
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground',
                      )}
                    >
                      {t(item.labelKey, {
                        defaultValue:
                          item.id.charAt(0).toUpperCase() + item.id.slice(1),
                      })}
                    </span>
                    {isSelected && (
                      <span
                        aria-hidden='true'
                        className='flex size-3.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground'
                      >
                        <Check className='size-2 stroke-[3]' />
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
