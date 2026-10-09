/**
 * The composer's model choice: an online conversation whose agent lists more than one model picks the one it answers
 * with from its next run. The conversation remembers it; hidden when there is nothing to choose. Before a new chat's
 * first message it takes the chosen agent's list (`ChatAgent.models`) and the choice the view keeps until the
 * conversation is created with it. The trigger fits the composer's width (an `@container`): the model's label alone
 * where the composer is narrow, such as in the chat panel, after its service's title where it is wide; the whole name
 * is in the tooltip and the accessible name, and the menu groups the models by service.
 */
import {
  sameEntry,
  type OnlineModelEntry,
} from '@nocobase/app-plugin-agents/shared/agents';
import type {
  ChatModelChoice,
  ConversationDetail,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { CpuIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#components/ui/tooltip';

import { useChatTranslation } from './chat-i18n.js';

const keyOf = (entry: OnlineModelEntry): string =>
  `${entry.modelService}\u0000${entry.model}`;

/** The full name of a choice: its service's title and the model's label. */
const nameOf = (entry: ChatModelChoice): string =>
  `${entry.serviceTitle} · ${entry.modelLabel}`;

/** The choices by service, in the order the services first appear, each keeping its place in the list. */
function byService(
  models: readonly ChatModelChoice[],
): { title: string; entries: { entry: ChatModelChoice; index: number }[] }[] {
  const groups = new Map<
    string,
    { title: string; entries: { entry: ChatModelChoice; index: number }[] }
  >();
  models.forEach((entry, index) => {
    const group = groups.get(entry.modelService) ?? {
      title: entry.serviceTitle,
      entries: [],
    };
    group.entries.push({ entry, index });
    groups.set(entry.modelService, group);
  });
  return [...groups.values()];
}

export interface ModelPickerProps {
  readonly conversation: Pick<ConversationDetail, 'mode' | 'model' | 'models'>;
  readonly disabled?: boolean;
  /** Null: the agent's default (its first model). */
  readonly onChange: (model: OnlineModelEntry | null) => void;
}

export function ModelPicker({
  conversation,
  disabled,
  onChange,
}: ModelPickerProps): ReactElement | null {
  const { t } = useChatTranslation();
  const { models, model } = conversation;
  const first = models[0];
  if (conversation.mode !== 'online' || models.length < 2 || !first)
    return null;
  const value = model ? keyOf(model) : keyOf(first);
  const current = models.find((entry) => keyOf(entry) === value) ?? first;
  const items = models.map((entry) => ({
    value: keyOf(entry),
    label: nameOf(entry),
  }));
  return (
    <Select
      items={items}
      value={value}
      disabled={disabled ?? false}
      onValueChange={(next: string | null) => {
        const index = models.findIndex((entry) => keyOf(entry) === next);
        const chosen = models[index];
        if (index < 0 || !chosen) return;
        if (model && sameEntry(chosen, model)) return;
        // The first entry is the agent's default: choosing it follows the agent.
        onChange(index === 0 ? null : chosen);
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={
              <SelectTrigger
                size='sm'
                className='h-7 w-auto max-w-40 min-w-0 shrink-0 border-none bg-transparent px-1.5 text-xs text-muted-foreground shadow-none hover:bg-muted @md:max-w-64 @md:px-2 dark:bg-transparent'
                aria-label={t('chat.model.current', { name: nameOf(current) })}
                data-testid='chat-model'
              />
            }
          >
            <CpuIcon data-icon='inline-start' className='hidden @md:block' />
            {/* The model's label, after its service's where the composer is wide: the menu says which one is the default. */}
            <SelectValue className='min-w-0 truncate'>
              {() => (
                <>
                  <span
                    className='hidden text-muted-foreground/70 @md:inline'
                    data-testid='chat-model-service'
                  >
                    {current.serviceTitle}
                    <span aria-hidden='true'>{' · '}</span>
                  </span>
                  <span className='min-w-0 truncate text-foreground'>
                    {current.modelLabel}
                  </span>
                </>
              )}
            </SelectValue>
          </TooltipTrigger>
          <TooltipContent>{nameOf(current)}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        {byService(models).map((group) => (
          <SelectGroup key={group.entries[0]?.entry.modelService}>
            <SelectLabel>{group.title}</SelectLabel>
            {group.entries.map(({ entry, index }) => (
              <SelectItem key={keyOf(entry)} value={keyOf(entry)}>
                {index === 0
                  ? t('chat.model.default', { model: entry.modelLabel })
                  : entry.modelLabel}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
