import { useAgentText } from '@nocobase/app-plugin-agents/client/chat';
import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';
import type {
  ModelRef,
  ModelService,
} from '@nocobase/app-plugin-agents/shared/models';
import type { ReactElement } from 'react';

import { AgentPicker } from '#components/agent-picker';

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
