import type { Logger } from '@nocobase/logging';
import type { AgentEventHandler, AgentExecutionMode } from '../types.js';
import type { AIConversationRepository } from '../../repository/ai-conversation.js';

export class ConversationEventHandler implements AgentEventHandler {
  public constructor(
    private readonly conversations: AIConversationRepository,
    private readonly sessionId: string,
    private readonly logger?: Logger,
  ) {}

  public async beforeExecution(mode: AgentExecutionMode): Promise<void> {
    // The parallel run limit counts a run from `updatedAt`, which an update does not set on its own.
    await this.conversations.update({
      values: { llmActiveState: mode, updatedAt: new Date() },
      filter: { sessionId: this.sessionId },
    });
  }

  public async afterExecution(
    mode: AgentExecutionMode,
    result?: { aborted?: boolean },
  ): Promise<void> {
    await this.conversations.update({
      values: {
        llmActiveState: 'idle',
        ...(mode === 'streaming'
          ? { read: result?.aborted ? true : false }
          : {}),
      },
      filter: { sessionId: this.sessionId },
    });
    this.logger?.debug?.(
      { sessionId: this.sessionId, mode },
      'Conversation execution completed',
    );
  }
}
