import { monitorEventLoopDelay, type IntervalHistogram } from 'node:perf_hooks';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { cachingToken } from '@nocobase/app-server/caching';
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  realtimeServiceToken,
  type RealtimeUserTopic,
} from '@nocobase/app-server/realtime';
import { apiDocsToken } from '@nocobase/app-server/router';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  AGENT_SESSIONS_TOPIC,
  type AgentSessionsChange,
} from '../../shared/api.js';
import { computerKeyFragment, computerKeyResolver } from '../computer-key.js';
import { createImageStorage } from '../images.js';
import { AgentSessionsService } from '../service.js';
import { agentSessionsToken } from '../tokens.js';
import { createToolTokens } from '../tools.js';

export class AgentSessionsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-agent-sessions';

  #topic: RealtimeUserTopic<AgentSessionsChange> | undefined;
  readonly #releases: (() => void)[] = [];
  #loopDelay: IntervalHistogram | undefined;

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
      const logger = container.has(loggingToken)
        ? container.resolve(loggingToken).getLogger('agent-sessions')
        : undefined;
      return new AgentSessionsService({
        ...(logger?.isLevelEnabled('debug')
          ? {
              diagnose: (phase, fields) => {
                if (logger.isLevelEnabled('debug'))
                  logger.debug(
                    {
                      phase,
                      ...fields,
                      eventLoopDelayMaxMs: this.#loopDelay
                        ? this.#loopDelay.max / 1e6
                        : undefined,
                    },
                    'Agent sessions timing',
                  );
              },
            }
          : {}),
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
        // Asked on each use: the application's default Drive disk, through the file plugin when it is registered.
        images: createImageStorage({
          uploader: () =>
            container.has(serverFileRepositoryManagerToken)
              ? container.resolve(serverFileRepositoryManagerToken)
              : null,
          disks: () =>
            container.has(driveManagerToken)
              ? container.resolve(driveManagerToken)
              : null,
          disk: () =>
            this.app.config.get<{ readonly default?: string }>('drive')
              ?.default ?? 'local',
        }),
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

  /** Teaches the application's authentication and its API document the computers' keys. */
  public override start(): Promise<void> {
    const logger = this.app.container.has(loggingToken)
      ? this.app.container.resolve(loggingToken).getLogger('agent-sessions')
      : undefined;
    if (logger?.isLevelEnabled('debug')) {
      this.#loopDelay = monitorEventLoopDelay({ resolution: 20 });
      this.#loopDelay.enable();
    }
    return Promise.resolve();
  }

  public override boot(): Promise<void> {
    const { container } = this.app;
    const service = container.resolve(agentSessionsToken);
    if (container.has(authenticationToken))
      this.#releases.push(
        container
          .resolve(authenticationToken)
          .addCredentialResolver(computerKeyResolver(service)),
      );
    if (container.has(apiDocsToken))
      this.#releases.push(
        container.resolve(apiDocsToken).addFragment(computerKeyFragment),
      );
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.#loopDelay?.disable();
    for (const release of this.#releases.splice(0)) release();
    this.#topic?.close();
    this.#topic = undefined;
    return Promise.resolve();
  }
}
