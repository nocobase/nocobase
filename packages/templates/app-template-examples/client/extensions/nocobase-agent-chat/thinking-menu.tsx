import { thinkingLevelText } from '@nocobase/app-plugin-agents/client/chat';
import {
  REASONING_LEVELS,
  type ReasoningLevel,
} from '@nocobase/app-plugin-agents/shared/models';
import { BrainIcon } from 'lucide-react';
import { useLayoutEffect, useRef, type ReactElement } from 'react';

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '#components/ui/dropdown-menu';
import { Separator } from '#components/ui/separator';
import { cn } from 'cn';

import { useChatTranslation } from './chat-i18n.js';

export interface ThinkingMenuProps {
  readonly value: ReasoningLevel;
  readonly onChange: (level: ReasoningLevel) => void;
  readonly disabled?: boolean;
}

/**
 * Inline settings for the selected Online model, never a Runner agent: every level, whatever the model. Whether the
 * provider applies one is up to its SDK package and the provider itself.
 */
export function ThinkingMenu({
  value,
  onChange,
  disabled,
}: ThinkingMenuProps): ReactElement {
  const { t } = useChatTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const reveal = (element: HTMLElement | null) => {
    const scroll = scrollRef.current;
    if (!scroll || !element || !scroll.contains(element)) return;
    const item = element.getBoundingClientRect();
    const viewport = scroll.getBoundingClientRect();
    // Scroll only the manual levels, not the default, model list or page.
    if (item.left < viewport.left)
      scroll.scrollLeft += item.left - viewport.left;
    else if (item.right > viewport.right)
      scroll.scrollLeft += item.right - viewport.right;
  };
  useLayoutEffect(() => {
    reveal(scrollRef.current?.querySelector('[aria-checked="true"]') ?? null);
  }, [value]);
  const label = (level: ReasoningLevel) => thinkingLevelText(level, t);
  const name = t('chat.thinking.choose', { level: label(value) });
  const itemClass =
    'min-h-7 min-w-7 shrink-0 justify-center px-2 py-1 text-xs whitespace-nowrap focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden';
  return (
    <DropdownMenuRadioGroup
      value={value}
      aria-label={name}
      data-testid='chat-thinking-control'
      className='mx-1 mb-1 flex min-w-0 items-center gap-1.5 py-1 pl-3 pr-1'
      onValueChange={(next) => {
        if (
          !disabled &&
          next !== value &&
          REASONING_LEVELS.includes(next as ReasoningLevel)
        ) {
          onChange(next as ReasoningLevel);
        }
      }}
      onKeyDownCapture={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
          return;
        const items = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            '[role="menuitemradio"]:not([aria-disabled="true"])',
          ),
        );
        const index = items.indexOf(event.target as HTMLElement);
        if (index < 0) return;
        event.preventDefault();
        event.stopPropagation();
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) %
                items.length;
        items[next]?.focus();
        reveal(items[next] ?? null);
      }}
    >
      <span className='shrink-0 text-muted-foreground' title={name}>
        <BrainIcon className='size-3.5' aria-hidden='true' />
      </span>
      <DropdownMenuRadioItem
        value='default'
        disabled={disabled}
        closeOnClick={false}
        title={t('chat.thinking.useDefault')}
        data-testid='chat-thinking-default'
        className={cn(
          itemClass,
          value === 'default'
            ? 'bg-accent font-medium text-accent-foreground'
            : 'text-muted-foreground',
        )}
      >
        {label('default')}
      </DropdownMenuRadioItem>
      <Separator orientation='vertical' className='h-4 shrink-0' />
      <div
        ref={scrollRef}
        className='min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]'
        data-testid='chat-thinking-levels'
      >
        <div className='flex w-max min-w-full items-center gap-0.5 rounded-lg bg-muted p-0.5'>
          {REASONING_LEVELS.filter((level) => level !== 'default').map(
            (level) => (
              <DropdownMenuRadioItem
                key={level}
                value={level}
                disabled={disabled}
                closeOnClick={false}
                onFocus={(event) => reveal(event.currentTarget)}
                className={cn(
                  itemClass,
                  'min-w-max flex-auto',
                  value === level
                    ? 'bg-background font-medium text-foreground shadow-xs'
                    : 'text-muted-foreground',
                )}
              >
                {label(level)}
              </DropdownMenuRadioItem>
            ),
          )}
        </div>
      </div>
    </DropdownMenuRadioGroup>
  );
}
