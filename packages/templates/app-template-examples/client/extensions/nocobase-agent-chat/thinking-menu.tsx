import {
  thinkingControlOf,
  thinkingLevelText,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ModelCapabilities,
  ReasoningLevel,
} from '@nocobase/app-plugin-agents/shared/models';
import { BrainIcon, ChevronDownIcon, RotateCcwIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { Button } from '#components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu';
import { Switch } from '#components/ui/switch';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';

/**
 * The thinking level beside the model choice. A model that takes only the provider's default shows nothing; one that
 * can turn thinking off and on at one level shows a switch (`ThinkingSwitch`); any other lists its levels. Default is
 * always a choice, so the provider's own setting can be restored.
 */
export function ThinkingMenu({
  capabilities,
  value,
  onChange,
  disabled,
}: {
  readonly capabilities: ModelCapabilities | undefined;
  readonly value: ReasoningLevel;
  readonly onChange: (level: ReasoningLevel) => void;
  readonly disabled?: boolean;
}): ReactElement | null {
  const { t } = useChatTranslation();
  const control = thinkingControlOf(capabilities);
  if (control.kind === 'none') return null;
  if (control.kind === 'toggle')
    return (
      <ThinkingSwitch
        on={control.on}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  const label = (level: ReasoningLevel) => thinkingLevelText(level, t);
  // A level the model no longer takes is shown as it is saved; the server runs it at the nearest one it takes.
  const current = label(value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={
          <Button
            type='button'
            variant={value === 'default' ? 'ghost' : 'secondary'}
            size='sm'
            className={cn(
              'h-7 shrink-0 gap-1 rounded-full px-2',
              value === 'default' && 'text-muted-foreground',
            )}
            aria-label={t('chat.thinking.choose', { level: current })}
            title={t('chat.thinking.choose', { level: current })}
            data-testid='chat-thinking-menu'
          />
        }
      >
        <BrainIcon aria-hidden='true' />
        <span className='hidden @md:inline'>{current}</span>
        <ChevronDownIcon aria-hidden='true' className='size-3 opacity-60' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-auto min-w-36'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('chat.thinking.title')}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next: unknown) => {
              if (typeof next === 'string' && next !== value)
                onChange(next as ReasoningLevel);
            }}
          >
            {control.levels.map((level) => (
              <DropdownMenuRadioItem key={level} value={level} closeOnClick>
                {label(level)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The switch for a model that can turn thinking off and on at one level: on chooses that level, off turns thinking
 * off. While neither is chosen the provider's default applies, which the switch says beside it; once one is chosen, a
 * button beside it goes back to the default.
 */
function ThinkingSwitch({
  on,
  value,
  onChange,
  disabled,
}: {
  readonly on: ReasoningLevel;
  readonly value: ReasoningLevel;
  readonly onChange: (level: ReasoningLevel) => void;
  readonly disabled?: boolean;
}): ReactElement {
  const { t } = useChatTranslation();
  const state =
    value === 'default'
      ? t('chat.thinking.levels.default')
      : value === 'off'
        ? t('chat.thinking.levels.off')
        : t('chat.thinking.on');
  const name = t('chat.thinking.choose', { level: state });
  return (
    <span
      className='flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground'
      data-testid='chat-thinking-control'
    >
      <span className='flex items-center gap-1.5' title={name}>
        <BrainIcon aria-hidden='true' className='size-4' />
        <span className='hidden @md:inline' aria-hidden='true'>
          {t('chat.thinking.title')}
        </span>
        <Switch
          size='sm'
          checked={value !== 'default' && value !== 'off'}
          disabled={disabled}
          aria-label={name}
          data-testid='chat-thinking-switch'
          onCheckedChange={(checked: boolean) => onChange(checked ? on : 'off')}
        />
      </span>
      {value === 'default' ? (
        // Narrow toolbars leave it to the name and the missing default button: one more word wraps them.
        <span className='hidden @md:inline' aria-hidden='true'>
          {state}
        </span>
      ) : (
        <Button
          type='button'
          variant='ghost'
          size='icon-xs'
          className='rounded-full'
          disabled={disabled}
          aria-label={t('chat.thinking.useDefault')}
          title={t('chat.thinking.useDefault')}
          data-testid='chat-thinking-default'
          onClick={() => onChange('default')}
        >
          <RotateCcwIcon aria-hidden='true' />
        </Button>
      )}
    </span>
  );
}
