/**
 * Who a new conversation goes to, chosen in the composer's toolbar before its first message, the way the agent is
 * chosen in other AI products: every enabled agent the viewer may chat with, with what it is good at, its tags and why
 * one cannot answer now. The panel's new conversation and an application's own place to start one (such as an
 * application's home page) use it alike, so both show the same picker. Once the conversation exists its agent is its
 * identity, shown read-only above it (`AgentLine`).
 */
import { useAgentText } from '@nocobase/app-plugin-agents/client/chat';
import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';
import type { ReactElement } from 'react';

import { AgentPicker } from '#components/agent-picker';

import { useAgentPickerLabels } from './chat-i18n.js';

export interface NewChatChoiceProps {
  /** Every agent the viewer may chat with. */
  readonly agents: readonly ChatAgent[];
  /** The agent the conversation will go to; null while there is none. */
  readonly agent: ChatAgent | null;
  readonly onAgentChange: (agentId: string) => void;
  readonly disabled?: boolean;
}

export function NewChatChoice({
  agents,
  agent,
  onAgentChange,
  disabled,
}: NewChatChoiceProps): ReactElement {
  const labels = useAgentPickerLabels();
  const text = useAgentText();
  return (
    <AgentPicker
      agents={agents}
      value={agent?.id ?? null}
      onSelect={onAgentChange}
      agentName={(item) => text.name(item)}
      labels={labels}
      disabled={disabled ?? false}
      // Fits the composer's width, and the first to give up its width.
      appearance='toolbar'
      className='h-7 shrink px-1.5 @md:px-2'
      data-testid='chat-agent-picker'
    />
  );
}
