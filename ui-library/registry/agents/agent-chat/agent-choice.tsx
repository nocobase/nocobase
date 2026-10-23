import { useAgentText } from '@nocobase/app-plugin-agents/client/chat';
import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';
import type {
  ModelRef,
  ModelService,
} from '@nocobase/app-plugin-agents/shared/models';
import type { ReactElement } from 'react';

import { AgentPicker } from '#components/agent-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';

import { useAgentPickerLabels, useChatTranslation } from './chat-i18n.js';

export interface NewChatChoiceProps {
  readonly agents: readonly ChatAgent[];
  readonly agent: ChatAgent | null;
  readonly services: readonly ModelService[];
  readonly model: ModelRef | null;
  readonly onModelChange: (model: ModelRef) => void;
  readonly onAgentChange: (agentId: string) => void;
  readonly modelsDisabled?: boolean;
  readonly disabled?: boolean;
}

/** Native choices are models; Runner choices retain the existing Agent row and all its metadata. */
export function NewChatChoice({
  agents,
  agent,
  services,
  model,
  onModelChange,
  onAgentChange,
  modelsDisabled,
  disabled,
}: NewChatChoiceProps): ReactElement {
  const labels = useAgentPickerLabels();
  const { t } = useChatTranslation();
  const text = useAgentText();
  const native = agents.some((item) => item.id === 'online');
  return (
    <AgentPicker
      agents={agents.filter((item) => item.id !== 'online')}
      value={agent?.id === 'online' ? null : (agent?.id ?? null)}
      onSelect={onAgentChange}
      {...(native
        ? {
            models: {
              services,
              value: agent?.id === 'online' ? model : null,
              onSelect: onModelChange,
              disabled: modelsDisabled ?? false,
            },
          }
        : {})}
      agentName={(item) => text.name(item)}
      labels={{
        ...labels,
        modelPlaceholder:
          !modelsDisabled && !model
            ? t('chat.agents.defaultModel')
            : labels.modelPlaceholder,
      }}
      disabled={disabled ?? false}
      appearance='toolbar'
      className='h-7 shrink px-1.5 @md:px-2'
      data-testid='chat-agent-picker'
    />
  );
}

/** Existing native conversations may change their model, never their Agent. */
export function ConversationModelChoice({
  services,
  model,
  allowedModels,
  onModelChange,
  disabled,
}: {
  readonly services: readonly ModelService[];
  readonly model: ModelRef | null;
  readonly allowedModels?: readonly string[];
  readonly onModelChange: (model: ModelRef) => void;
  readonly disabled: boolean;
}): ReactElement {
  const labels = useAgentPickerLabels();
  const { t } = useChatTranslation();
  const offered = services.map((service) => ({
    ...service,
    models: service.models.filter(
      (item) =>
        !allowedModels?.length ||
        allowedModels.includes(`${service.name}/${item.value}`),
    ),
  }));
  return (
    <AgentPicker
      agents={[]}
      value={null}
      onSelect={() => {}}
      models={{
        services: offered,
        value: model,
        onSelect: onModelChange,
        disabled,
      }}
      labels={{
        ...labels,
        modelPlaceholder: model?.model ?? labels.modelPlaceholder,
        modelSwitch: t('chat.agents.modelOnlySwitch', {
          name: '{name}',
          service: '{service}',
        }),
        search: t('chat.agents.modelSearch'),
        noResults: t('chat.agents.noMatchingModels'),
      }}
      disabled={disabled}
      appearance='toolbar'
      className='h-7 shrink px-1.5 @md:px-2'
      data-testid='chat-model-picker'
    />
  );
}

const EFFORT_LEVELS = [
  'off',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
] as const;

/**
 * The reasoning effort of a runner conversation's runs, among the efforts its agent's tool takes; nothing when it takes
 * none. Null shows the agent's default.
 */
export function EffortChoice({
  efforts,
  value,
  onChange,
  disabled,
}: {
  readonly efforts: readonly string[];
  readonly value: string | null;
  readonly onChange: (effort: string) => void;
  readonly disabled?: boolean;
}): ReactElement | null {
  const { t } = useChatTranslation();
  if (efforts.length === 0) return null;
  const label = (effort: string): string =>
    (EFFORT_LEVELS as readonly string[]).includes(effort)
      ? t(`chat.effort.levels.${effort as (typeof EFFORT_LEVELS)[number]}`)
      : effort;
  const items = efforts.map((effort) => ({
    value: effort,
    label: label(effort),
  }));
  const shown = value ? label(value) : t('chat.effort.default');
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next: string | null) => {
        if (next) onChange(next);
      }}
      disabled={disabled ?? false}
    >
      <SelectTrigger
        size='sm'
        className='h-7 min-w-0 shrink gap-1 border-transparent bg-transparent px-1.5 text-xs text-muted-foreground shadow-none hover:bg-muted dark:bg-transparent @md:px-2'
        aria-label={t('chat.effort.trigger', { effort: shown })}
        title={t('chat.effort.label')}
        data-testid='chat-effort-picker'
      >
        <SelectValue placeholder={t('chat.effort.default')} />
      </SelectTrigger>
      <SelectContent className='w-auto min-w-(--anchor-width)'>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
