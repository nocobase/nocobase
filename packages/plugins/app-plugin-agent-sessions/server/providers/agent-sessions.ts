import { cachingToken } from '@nocobase/app-server/caching';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  realtimeServiceToken,
  type RealtimeUserTopic,
} from '@nocobase/app-server/realtime';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  AGENT_SESSIONS_TOPIC,
  type AgentSessionsChange,
} from '../../shared/api.js';
import { AgentSessionsService } from '../service.js';
import { agentSessionsToken } from '../tokens.js';
import { createToolTokens } from '../tools.js';

export class AgentSessionsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-agent-sessions';

  #topic: RealtimeUserTopic<AgentSessionsChange> | undefined;

  public override register(): void {
    this.app.container.singleton(agentSessionsToken, (container) => {
      if (container.has(realtimeServiceToken)) {
        this.#topic = container
          .resolve(realtimeServiceToken)
          .defineTopic<AgentSessionsChange, 'user'>(AGENT_SESSIONS_TOPIC, {
            audience: 'user',
          });
      }
      const topic = this.#topic;
      const secrets = container.has(secretsServiceToken)
        ? container.resolve(secretsServiceToken)
        : undefined;
      return new AgentSessionsService({
        database: container.resolve(databaseManagerToken),
        // Without a secrets key there is nothing to sign tool tokens with, and sessions get no tools.
        ...(secrets?.ready
          ? {
              toolTokens: createToolTokens(() =>
                secrets.keyring('agent-sessions/tools'),
              ),
            }
          : {}),
        ...(topic
          ? {
              publish: (userId, change) =>
                void topic.publishFor(userId, change),
            }
          : {}),
        // A bridge's reply may reach another instance than the request waiting for it.
        ...(container.has(cachingToken)
          ? {
              replies: container
                .resolve(cachingToken)
                .getCache({ namespace: 'agent-sessions:replies' }),
            }
          : {}),
      });
    });
  }

  public override shutdown(): Promise<void> {
    this.#topic?.close();
    this.#topic = undefined;
    return Promise.resolve();
  }
}
