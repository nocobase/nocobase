/**
 * The agent's choices as the composer's menus: model, reasoning effort, speed and mode on its bar, and whatever else
 * the agent offers in a "more" menu. Each menu lists the agent's own names and descriptions for its values.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import {
  BrainIcon,
  ChevronDownIcon,
  CpuIcon,
  GaugeIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';

import type { SessionChoice } from '../../shared/api.js';
import { offeredChoices, onBar, valueName } from '../lib/choices.js';

/** The icon of each choice on the bar, its name showing on hover; Codex's fast mode is a `model_config`. */
const ICONS: Readonly<Record<string, typeof CpuIcon>> = {
  model: CpuIcon,
  thought_level: BrainIcon,
  model_config: GaugeIcon,
  mode: ShieldIcon,
};

function ChoiceIcon({
  category,
}: {
  readonly category: string | undefined;
}): ReactElement {
  const Icon = ICONS[category ?? ''] ?? SlidersHorizontalIcon;
  return <Icon className='size-4 shrink-0' />;
}

const TRIGGER =
  'text-muted-foreground hover:bg-muted hover:text-foreground aria-expanded:bg-muted inline-flex h-8 items-center gap-1 rounded-md px-1 text-xs whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50';

export function ChoiceMenus({
  choices,
  values,
  disabled,
  loading,
  onChoose,
}: {
  readonly choices: readonly SessionChoice[] | undefined;
  /** The values chosen so far, by choice id; a choice left out shows its current value. */
  readonly values?: Readonly<Record<string, string>>;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onChoose: (choiceId: string, value: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const offered = offeredChoices(choices);
  const more = offered.filter((choice) => !onBar(choice));
  const valueOf = (choice: SessionChoice): string =>
    values?.[choice.id] ?? choice.currentValue;
  return (
    <>
      {offered
        .filter((choice) => choice.options.length === 1)
        .map((choice) => (
          <span
            key={choice.id}
            title={choice.name}
            className={`${TRIGGER} shrink-0`}
          >
            <ChoiceIcon category={choice.category} />
            <span>
              {choice.name}: {valueName(choice, valueOf(choice))}
            </span>
          </span>
        ))}
      {offered
        .filter((choice) => onBar(choice) && choice.options.length > 1)
        .map((choice) => (
          <DropdownMenu key={choice.id}>
            <DropdownMenuTrigger
              disabled={disabled || (loading && choice.category !== 'model')}
              aria-busy={loading && choice.category !== 'model'}
              title={choice.name}
              className={`${TRIGGER} shrink-0`}
            >
              <ChoiceIcon category={choice.category} />
              <span
                className={cn(
                  'text-foreground font-medium',
                  // A model's name can be long; the others are a word or two.
                  choice.category === 'model' && 'max-w-40 truncate',
                )}
              >
                {valueName(choice, valueOf(choice))}
              </span>
              <ChevronDownIcon className='size-3.5 shrink-0' />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='start'
              className='max-h-96 w-72 overflow-y-auto'
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>{choice.name}</DropdownMenuLabel>
                <Options
                  choice={choice}
                  value={valueOf(choice)}
                  onChoose={onChoose}
                />
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
      {more.some((choice) => choice.options.length > 1) && (
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={disabled || loading}
            aria-busy={loading}
            aria-label={t('choices.more')}
            title={t('choices.more')}
            className={`${TRIGGER} shrink-0`}
          >
            <SlidersHorizontalIcon className='size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-64'>
            {more
              .filter((choice) => choice.options.length > 1)
              .map((choice) => (
                <DropdownMenuSub key={choice.id}>
                  <DropdownMenuSubTrigger>
                    <span className='min-w-0 flex-1 truncate'>
                      {choice.name}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {valueName(choice, valueOf(choice))}
                    </span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className='max-h-96 w-64 overflow-y-auto'>
                    <Options
                      choice={choice}
                      value={valueOf(choice)}
                      onChoose={onChoose}
                    />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

function Options({
  choice,
  value,
  onChoose,
}: {
  readonly choice: SessionChoice;
  readonly value: string;
  readonly onChoose: (choiceId: string, value: string) => void;
}): ReactElement {
  return (
    <DropdownMenuRadioGroup
      value={value}
      onValueChange={(next: string) => onChoose(choice.id, next)}
    >
      {choice.options.map((option) => (
        <DropdownMenuRadioItem
          key={option.value}
          value={option.value}
          closeOnClick
        >
          <span className='flex min-w-0 flex-col'>
            <span className='truncate'>{option.name}</span>
            {option.description && (
              <span className='text-muted-foreground text-xs'>
                {option.description}
              </span>
            )}
          </span>
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
