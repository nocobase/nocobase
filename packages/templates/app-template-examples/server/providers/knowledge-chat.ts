import type { Application } from '@nocobase/app-server/application';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import { ServiceProvider } from '@nocobase/service-provider';
import packageMetadata from '../../package.json' with { type: 'json' };
import {
  KNOWLEDGE_CHAT_SOURCE,
  KNOWLEDGE_CHAT_SCOPE,
  knowledgeChatVariables,
} from '../../shared/knowledge-chat.js';

/** A browser-selectable policy; Knowledge owns prompt rendering, retrieval and ACL. */
export default class KnowledgeChatProvider extends ServiceProvider<Application> {
  public readonly name = 'examples/knowledge-chat';

  public override async boot(): Promise<void> {
    const agents = this.app.container.resolve(agentsToken);
    agents.conversations.sources.register({
      key: KNOWLEDGE_CHAT_SOURCE,
      title: { key: 'knowledge.title', ns: packageMetadata.name },
    });
    agents.onlineAgent.configurator.registerOnlineAgentScope(
      KNOWLEDGE_CHAT_SCOPE,
      {
        systemPromptTemplate: {
          variableSchema: knowledgeChatVariables,
          // This scope only admits the browser enum; preserve Knowledge's globally rendered prompt.
          template: ({ systemPrompt }) => systemPrompt ?? '',
        },
      },
    );
  }
}
