import {
  thinkingControlOf,
  thinkingLevelText,
} from '@nocobase/app-plugin-agents/client/chat';
import type {
  ModelCapabilities,
  ReasoningLevel,
} from '@nocobase/app-plugin-agents/shared/models';
import { BrainIcon, ChevronDownIcon } from 'lucide-react';
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
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';

/**
 * The thinking level beside the model choice. A model that takes only the provider's default shows nothing; one that
 * can turn thinking off and on at one level shows default, off and on; any other lists its levels. Default is always
 * a choice, so the provider's own setting can be restored.
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
  const label = (level: ReasoningLevel) =>
    control.kind === 'toggle' && level === control.on
      ? t('chat.thinking.on')
      : thinkingLevelText(level, t);
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
