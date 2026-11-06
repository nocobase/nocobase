import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';
import { knowledgeOnlineAgent } from '../online-agent/integration.js';
import {
  knowledgePromptVariables,
  knowledgeSystemPrompt,
} from '../online-agent/prompt.js';

export class KnowledgeOnlineAgentProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name = 'knowledge.online-agent';
  private registered = false;

  public override async boot(): Promise<void> {
    if (this.registered) return;
    const integration = await knowledgeOnlineAgent(this.app.container);
    if (!integration) return;
    integration.onlineAgent.configurator.registerOnlineAgentGlobalScope({
      systemPromptTemplate: {
        template: (context) =>
          [
            context.systemPrompt,
            knowledgeSystemPrompt(knowledgePromptVariables(context.variable)),
          ]
            .filter(Boolean)
            .join('\n\n'),
      },
    });
    this.registered = true;
  }
}
