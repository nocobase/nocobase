/**
 * Binds the plugin's services, and at boot connects them to the platform: realtime announcements of runs and
 * conversations, and this instance's server executor, which runs online agents' runs (stopped again at shutdown,
 * handing back what it holds). The runners' side (their announcements, the sweeper and the wake-ups of work sent back
 * with a back-off) is `runners.ts`.
 */
import { HEADERS, type RunApp } from '@nocobase/agent-protocol';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { realtimeServiceToken } from '@nocobase/app-server/realtime';
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { apiDocsToken, cliToken } from '@nocobase/app-server/router';
import { every } from 'hono/combine';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  CONVERSATIONS_TOPIC,
  type ConversationChanged,
} from '../../shared/conversations.js';
import { runTopic, type RunChanged } from '../../shared/realtime.js';

import { createAgents, type Agents } from '../composition.js';
import { createChatFileStorage } from '../core/conversations/index.js';
import { directoryDisk } from '../core/skills/index.js';
import { createAgentsSecretsStores } from '../secrets-stores.js';
import type { VectorsConfig } from '../vectors/index.js';
import type { DistConfig } from '../distribution/index.js';
import { resolveAgentCli, type AgentCli } from '../core/runs/index.js';
import { runCredentialResolver } from '../cli/run-credential.js';
import { bindCliSurface, type CliSurface } from '../cli/surface.js';
import type { CallerIdentity } from '../core/callers/index.js';
import type { CommandSurface } from '../online/index.js';
import { agentsSecurityFragment } from '../routes/openapi.js';
import { agentsToken } from '../tokens.js';

/** `agents` in the application's configuration. */
export interface AgentsConfig {
  /**
   * The CLI agents talk to the application with, and where runners get it: `name` (the application's id from `app` when
   * left out), and `package`, the tarball this application serves (`{ kind: 'served' }`, from `dist` below) by default,
   * or an npm package and version, a tarball, or `{ kind: 'preinstalled' }` where runners have it. The run's token goes
   * in `credentialFile`, `.<name>/run.json` by default. An application may set its own, such as `acme`.
   */
  readonly cli?: Partial<AgentCli>;
  /**
   * How runners name this application, which they keep one registration per `id` for: the CLI's `name`, else the
   * application's name (`appName`), by default. An application may set its own, such as `{ id: 'acme', name: 'Acme' }`.
   */
  readonly app?: RunApp;
  /**
   * The tarballs of the runner and the application's CLI this application serves (`/api/agents/dist`): built into
   * `storage/runners/dist` by default, on the `stable` channel, the highest version unless `versions` pins one.
   */
  readonly dist?: DistConfig;
  /**
   * Online agents' runs, which each instance runs itself: `enabled` (true by default; false leaves them to the other
   * instances), `maxSteps`, the model calls a run may make (16 by default), and `consult`, the bounds of one agent
   * consulting another (`ask_agent`): `timeoutMs` (120000) and `tokenBudget`, input and output tokens (200000).
   */
  readonly server?: {
    readonly enabled?: boolean;
    readonly maxSteps?: number;
    readonly consult?: {
      readonly timeoutMs?: number;
      readonly tokenBudget?: number;
    };
  };
  /**
   * The vector store of vector collections, apart from the application's database: `store` (`sqlite-vec` by default,
   * in `path`, `storage/vectors.sqlite` by default; `pgvector` with its own `url` or `host`, `port`, `database`,
   * `user`, `password` and `ssl`; `false` turns vectors off). See `VectorsConfig`.
   */
  readonly vectors?: VectorsConfig;
  /** Skills: `disk`, the Drive disk their files' contents go to (Drive's default disk by default). */
  readonly skills?: {
    readonly disk?: string;
  };
}

/** The first purge of chat files never sent waits this long after boot, then runs every `PURGE_INTERVAL_MS`. */
const PURGE_DELAY_MS = 60_000;
const PURGE_INTERVAL_MS = 60 * 60_000;

export class AgentsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = ACCESS_NAMESPACE;
  private readonly releases: (() => void)[] = [];
  private stopping: Promise<void> | undefined;
  private stoppingVectors: Promise<void> | undefined;
  private surface: CliSurface | undefined;

  public override register(): void {
    this.app.container.singleton(agentsToken, (resolver) => {
      const config = this.app.config.get<AgentsConfig>('agents');
      return createAgents({
        database: resolver.resolve(databaseManagerToken),
        idGenerator: resolver.resolve(idGeneratorToken),
        app: this.runApp(config),
        dist: {
          ...config?.dist,
          dir: config?.dist?.dir
            ? this.app.paths.root(config.dist.dir)
            : this.app.paths.storage('runners/dist'),
        },
        ...(resolver.has(secretsServiceToken)
          ? { secrets: resolver.resolve(secretsServiceToken) }
          : {}),
        ...(config?.cli ? { cli: config.cli } : {}),
        manifestUrl: `${this.app.publicBasePath}/api/cli/manifest`,
        ...(config?.server?.maxSteps || config?.server?.consult
          ? {
              server: {
                ...(config.server.maxSteps
                  ? { maxSteps: config.server.maxSteps }
                  : {}),
                ...(config.server.consult
                  ? { consult: config.server.consult }
                  : {}),
              },
            }
          : {}),
        ...(config?.vectors ? { vectors: config.vectors } : {}),
        paths: {
          root: this.app.paths.root(),
          storage: this.app.paths.storage(),
        },
        commandsOf: (identity, token) => this.commandsOf(identity, token),
        // The contents of skills' files: on the Drive disk `agents.skills.disk` names (Drive's default), else under the
        // application's storage. Asked on each use, so a configuration reload applies.
        skillDisk: resolver.has(driveManagerToken)
          ? () =>
              resolver
                .resolve(driveManagerToken)
                .use(this.app.config.get<AgentsConfig>('agents')?.skills?.disk)
          : (() => {
              const disk = directoryDisk(this.app.paths.storage('agents'));
              return () => disk;
            })(),
        // Files sent in chat: the application's default Drive disk, through the file plugin when it is registered, as
        // the projects plugin stores issue files. Asked on each use.
        chatFiles: createChatFileStorage({
          uploader: () =>
            resolver.has(serverFileRepositoryManagerToken)
              ? resolver.resolve(serverFileRepositoryManagerToken)
              : null,
          disks: () =>
            resolver.has(driveManagerToken)
              ? resolver.resolve(driveManagerToken)
              : null,
          disk: () =>
            this.app.config.get<{ readonly default?: string }>('drive')
              ?.default ?? 'local',
          onError: (error) =>
            console.error('Agents could not delete a stored chat file.', error),
        }),
        basePath: () => this.app.publicBasePath,
      });
    });
    this.registerSecretsStores();
  }

  /** How runners name this application: `agents.app`, else the CLI's name, else the application's. */
  private runApp(config: AgentsConfig | undefined): RunApp {
    if (config?.app) return config.app;
    const id = config?.cli?.name ?? this.app.appName;
    return { id, name: id };
  }

  /**
   * An online run's commands from the application's command manifest, sent through the application itself with the
   * run's token; undefined without one (no API documentation or command line), which leaves its shell without a CLI.
   */
  private commandsOf(
    identity: CallerIdentity,
    token: string,
  ): Promise<CommandSurface> | undefined {
    const { container } = this.app;
    const surface = this.surface;
    if (!surface || !container.has(cliToken) || !container.has(apiDocsToken))
      return undefined;
    const cli = container.resolve(cliToken);
    const base = this.app.publicBasePath.replace(/\/+$/u, '');
    const agentsConfig = this.app.config.get<AgentsConfig>('agents');
    const bin = resolveAgentCli(
      agentsConfig?.cli,
      this.runApp(agentsConfig),
    ).name;
    return (async () => {
      const manifest = cli.manifestFor(
        await container.resolve(apiDocsToken).getDocument(),
        await surface.callerOf(identity),
      );
      return {
        bin,
        commands: manifest.commands,
        send: async (request) => {
          const path =
            base && request.path.startsWith(`${base}/`)
              ? request.path.slice(base.length)
              : request.path;
          return this.app.router.fetch(
            new Request(`http://application${path}`, {
              method: request.method,
              headers: {
                [HEADERS.runToken]: token,
                accept: 'application/json',
                // A form sets its own multipart content type.
                ...(typeof request.body === 'string'
                  ? { 'content-type': 'application/json' }
                  : {}),
              },
              ...(request.body === undefined ? {} : { body: request.body }),
            }),
          );
        },
      };
    })();
  }

  /** Where the plugin keeps sealed values, for `nocobase secrets status` and `secrets rotate`. */
  private registerSecretsStores(): void {
    const { container } = this.app;
    if (!container.has(secretsServiceToken)) return;
    const secrets = container.resolve(secretsServiceToken);
    for (const store of createAgentsSecretsStores(() =>
      container.resolve(databaseManagerToken).connection(),
    ))
      secrets.registerStore(store);
  }

  public override boot(): Promise<void> {
    if (this.releases.length > 0) return Promise.resolve();
    const { container } = this.app;
    const services = container.resolve(agentsToken);
    this.announce(services);
    // The run token, runner key and registration token as security schemes of the API document.
    if (container.has(apiDocsToken))
      this.releases.push(
        container.resolve(apiDocsToken).addFragment(agentsSecurityFragment),
      );
    this.bindAuthentication(services);
    this.purgeChatFiles(services);
    services.vectors.start();
    this.releases.push(() => {
      this.stoppingVectors = services.vectors.stop();
    });
    if (
      this.app.config.get<AgentsConfig>('agents')?.server?.enabled !== false
    ) {
      services.online.executor.start();
      this.releases.push(() => {
        this.stopping = services.online.executor.stop();
      });
    }
    return Promise.resolve();
  }

  /** Deletes the chat files never sent with a message, a minute after boot and then every hour. */
  private purgeChatFiles(services: Agents): void {
    const purge = () => {
      services.chatAttachments.purge().catch((error: unknown) => {
        console.error('Agents could not purge unsent chat files.', error);
      });
    };
    const first = setTimeout(purge, PURGE_DELAY_MS);
    const every = setInterval(purge, PURGE_INTERVAL_MS);
    first.unref();
    every.unref();
    this.releases.push(() => {
      clearTimeout(first);
      clearInterval(every);
    });
  }

  /**
   * Teaches the application's authentication the run token (a scoped session for the person who woke the agent), and
   * its command line who calls and which commands are custom.
   */
  private bindAuthentication(services: Agents): void {
    const { container } = this.app;
    if (!container.has(authenticationToken)) return;
    const auth = container.resolve(authenticationToken);
    this.releases.push(
      auth.addCredentialResolver(runCredentialResolver(services)),
    );
    if (!container.has(cliToken) || !container.has(authorizationToken)) return;
    const authorization = container.resolve(authorizationToken);
    const surface = bindCliSurface({
      cli: container.resolve(cliToken),
      auth: () => container.resolve(authenticationToken),
      authenticatePerson: every(
        auth.required({ scopedKeys: true }),
        authorization.middleware(),
      ),
      gate: services.gate,
    });
    this.surface = surface;
    this.releases.push(() => {
      surface.release();
      if (this.surface === surface) this.surface = undefined;
    });
  }

  public override async shutdown(): Promise<void> {
    for (const release of this.releases.splice(0)) release();
    await this.stopping;
    await this.stoppingVectors;
    this.stopping = undefined;
    this.stoppingVectors = undefined;
  }

  /** Tells open pages what changed; they fetch the details through the API, which checks access. */
  private announce(services: Agents): void {
    const { container } = this.app;
    if (!container.has(realtimeServiceToken)) return;
    const realtime = container.resolve(realtimeServiceToken);
    const publish = (topic: string, payload: RunChanged) => {
      try {
        realtime.publish(topic, payload);
      } catch (error) {
        console.error('Agents realtime announcement failed.', error);
      }
    };
    let conversationsTopic = false;
    try {
      this.releases.push(
        realtime.registerTopic(CONVERSATIONS_TOPIC, { audience: 'user' }),
      );
      conversationsTopic = true;
    } catch (error) {
      console.error(
        'Agents could not register the conversations topic.',
        error,
      );
    }
    const announceConversation = (
      userId: string,
      payload: ConversationChanged,
    ) => {
      if (!conversationsTopic) return;
      try {
        realtime.publish(CONVERSATIONS_TOPIC, payload, { userId });
      } catch (error) {
        console.error('Agents realtime announcement failed.', error);
      }
    };
    this.releases.push(
      services.events.onAny((event) => {
        switch (event.type) {
          case 'conversation.changed':
            announceConversation(
              event.userId,
              event.lastSeq === undefined
                ? {
                    kind: 'conversation.changed',
                    conversationId: event.conversationId,
                  }
                : {
                    kind: 'conversation.messages',
                    conversationId: event.conversationId,
                    lastSeq: event.lastSeq,
                  },
            );
            return;
          case 'run.changed':
            publish(runTopic(event.runId), {
              kind: 'run.status',
              runId: event.runId,
              status: event.status,
            });
            return;
          case 'run.events':
            publish(runTopic(event.runId), {
              kind: 'run.events',
              runId: event.runId,
              lastSeq: event.lastSeq,
            });
            return;
          case 'run.input':
            publish(runTopic(event.runId), {
              kind: 'run.input',
              runId: event.runId,
            });
            return;
          default:
            return;
        }
      }),
    );
  }
}
