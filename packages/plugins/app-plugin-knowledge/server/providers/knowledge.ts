/**
 * Binds the knowledge base (`knowledgeToken`) over the application's access resolver (`knowledgeAccessToken`, none until
 * it binds one) and its file storage (the file plugin's repository on a Drive disk), and announces on the realtime
 * topic `knowledge` that something changed, with ids only; open pages refetch. At start it picks up the files whose
 * text was being extracted, and the spaces being cut again, when the server stopped.
 *
 * The application configures files under `knowledge` (`config.yml`): `disk`, the Drive disk files go to (the Drive
 * default, else `local`), `maxFileSize` in bytes (100 MiB), and `cleanup`: how often expired upload tickets and stored
 * files nothing names are deleted (`intervalMinutes`, 60; `false` turns it off) and how old such a file must be
 * (`graceHours`, 24). The sweep runs on a timer from boot to shutdown, first a minute after boot.
 */
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  realtimeServiceToken,
  type DefinedRealtimeTopic,
} from '@nocobase/app-server/realtime';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  KNOWLEDGE_TOPIC,
  type KnowledgeChanged,
} from '../../shared/knowledge.js';
import { NO_ACCESS } from '../services/access.js';
import { createKnowledge } from '../services/knowledge.js';
import { createFileStore } from '../services/storage.js';
import { knowledgeAccessToken, knowledgeToken } from '../tokens.js';

/** What the application configures under `knowledge`. */
export interface KnowledgeConfig {
  /** The Drive disk files go to. */
  readonly disk?: string;
  /** The largest file stored, in bytes. */
  readonly maxFileSize?: number;
  /** The sweep of unused uploads; `false` turns it off. */
  readonly cleanup?:
    | false
    | {
        /** Minutes between sweeps; 60 by default. */
        readonly intervalMinutes?: number;
        /** How old an unused file must be to go; 24 hours by default. */
        readonly graceHours?: number;
      };
}

const MINUTE = 60_000;

export class KnowledgeProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-knowledge';
  private release?: () => void;
  private sweep?: { stop(): void };
  private topic?: DefinedRealtimeTopic<KnowledgeChanged, 'public'>;

  private onError = (message: string, error: unknown): void => {
    const { container } = this.app;
    if (container.has(loggingToken))
      container
        .resolve(loggingToken)
        .getLogger('knowledge')
        .error({ err: error }, message);
    else console.error(message, error);
  };

  public override register(): void {
    const { container } = this.app;
    const config = () =>
      this.app.config.get<KnowledgeConfig>('knowledge') ?? {};
    const maxFileSize = config().maxFileSize;
    this.app.container.singleton(knowledgeToken, (resolver) =>
      createKnowledge({
        database: resolver.resolve(databaseManagerToken),
        // Resolved on each question, so an application binding it after this plugin registers is still asked.
        access: {
          space: (space) => this.access().space(space),
          inherits: (space) => this.access().inherits(space),
          forReader: (reader) => this.access().forReader(reader),
          title: (space) => this.access().title(space),
          names: (refs) => this.access().names(refs),
        },
        newId: () => resolver.resolve(idGeneratorToken).generateString(),
        basePath: () => this.app.publicBasePath,
        files: {
          // Asked on each use: the file plugin and Drive, when the application registers them.
          store: () =>
            container.has(serverFileRepositoryManagerToken) &&
            container.has(driveManagerToken)
              ? createFileStore({
                  uploader: () =>
                    container.resolve(serverFileRepositoryManagerToken),
                  disks: () => container.resolve(driveManagerToken),
                  disk: () =>
                    config().disk ??
                    this.app.config.get<{ readonly default?: string }>('drive')
                      ?.default ??
                    'local',
                  onError: this.onError,
                })
              : null,
          ...(typeof maxFileSize === 'number' && maxFileSize > 0
            ? { maxBytes: maxFileSize }
            : {}),
        },
        onError: this.onError,
      }),
    );
  }

  private access() {
    const { container } = this.app;
    return container.has(knowledgeAccessToken)
      ? container.resolve(knowledgeAccessToken)
      : NO_ACCESS;
  }

  public override async start(): Promise<void> {
    const knowledge = this.app.container.resolve(knowledgeToken);
    try {
      await knowledge.files.resume();
    } catch (error) {
      this.onError('Could not resume parsing knowledge files.', error);
    }
    try {
      await knowledge.chunking.resume();
    } catch (error) {
      this.onError('Could not resume cutting knowledge spaces again.', error);
    }
  }

  /** Starts the sweep of unused uploads, unless the configuration turns it off. */
  private startCleanup(): void {
    const config = this.app.config.get<KnowledgeConfig>('knowledge')?.cleanup;
    if (this.sweep || config === false) return;
    const every = Math.max(1, config?.intervalMinutes ?? 60) * MINUTE;
    const graceMs = Math.max(0, config?.graceHours ?? 24) * 60 * MINUTE;
    const knowledge = this.app.container.resolve(knowledgeToken);
    let running = false;
    const run = () => {
      if (running) return;
      running = true;
      knowledge
        .cleanup({ graceMs })
        .catch((error: unknown) =>
          this.onError('Could not clear unused knowledge uploads.', error),
        )
        .finally(() => {
          running = false;
        });
    };
    const first = setTimeout(run, Math.min(MINUTE, every));
    const timer = setInterval(run, every);
    first.unref();
    timer.unref();
    this.sweep = {
      stop: () => {
        clearTimeout(first);
        clearInterval(timer);
      },
    };
  }

  public override boot(): Promise<void> {
    const { container } = this.app;
    this.startCleanup();
    if (this.release || !container.has(realtimeServiceToken))
      return Promise.resolve();
    this.topic = container
      .resolve(realtimeServiceToken)
      .defineTopic<KnowledgeChanged, 'public'>(KNOWLEDGE_TOPIC, {
        audience: 'public',
      });
    this.release = container.resolve(knowledgeToken).events.on((event) => {
      const payload: KnowledgeChanged =
        event.type === 'proposal.created' || event.type === 'proposal.decided'
          ? {
              kind: 'knowledge.changed',
              proposalId: event.proposal.id,
              ...(event.proposal.docId ? { docId: event.proposal.docId } : {}),
            }
          : { kind: 'knowledge.changed', docId: event.docId };
      try {
        void this.topic?.publish(payload);
      } catch (error) {
        this.onError('Could not announce a knowledge change.', error);
      }
    });
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.sweep?.stop();
    this.sweep = undefined;
    this.release?.();
    this.release = undefined;
    this.topic?.close();
    this.topic = undefined;
    return Promise.resolve();
  }
}
