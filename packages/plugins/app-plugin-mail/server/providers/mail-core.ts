import {
  ServiceProvider,
  type ServiceResolver,
} from '@nocobase/service-provider';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { loggingToken } from '@nocobase/app-server/logging';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import type { JobExecutor } from '@nocobase/jobs';
import {
  driveManagerToken,
  type AppDriveConfig,
} from '@nocobase/app-server/drive';
import {
  realtimeServiceToken,
  type RealtimeUserTopic,
} from '@nocobase/app-server/realtime';

import { createMailProviderAdapterResolver } from '../adapter-resolver.js';
import {
  resolveMailAutomaticSyncIntervalFromMs,
  resolveMailConfig,
  type MailConfig,
} from '../config.js';
import { createDatabaseMailCredentialVault } from '../credentials.js';
import { createMailProviderRegistry } from '../registry.js';
import { createMailRuntime } from '../runtime.js';
import { DefaultMailService } from '../service.js';
import { DriveMailOutboundAttachmentStorage } from '../outbound-attachments.js';
import {
  MAIL_REALTIME_TOPIC,
  type MailMessageChangeNotifier,
  type MailRealtimeEvent,
} from '../realtime.js';
import { createDatabaseMailStore } from '../store.js';
import {
  mailProviderAdapterResolverToken,
  mailCredentialVaultToken,
  mailProviderRegistryToken,
  mailRuntimeToken,
  mailServiceToken,
  mailOutboundAttachmentStorageToken,
  mailStoreToken,
} from '../tokens.js';
import { mailFailedPrecondition } from '../services/errors.js';

export type MailCoreProviderApplication = AppPluginApplication;

export class MailCoreProvider extends ServiceProvider<MailCoreProviderApplication> {
  public readonly name: string = '@nocobase/app-plugin-mail';
  private realtimeTopic?: RealtimeUserTopic<MailRealtimeEvent>;
  private missingMailConfigWarningLogged = false;
  private readonly messageChangeNotifier: MailMessageChangeNotifier = {
    notify: (userId) => {
      this.realtimeTopic?.publishFor(userId, { kind: 'mail.changed' });
    },
  };

  public override register(): void {
    const registry = createMailProviderRegistry();
    this.app.container.instance(mailProviderRegistryToken, registry);
    this.app.container.singleton(mailStoreToken, (container) =>
      createDatabaseMailStore(container.resolve(databaseManagerToken)),
    );
    if (!this.app.container.has(mailCredentialVaultToken)) {
      this.app.container.singleton(mailCredentialVaultToken, (container) =>
        createDatabaseMailCredentialVault(
          container.resolve(databaseManagerToken),
        ),
      );
    }
    this.app.container.singleton(
      mailProviderAdapterResolverToken,
      (container) =>
        createMailProviderAdapterResolver({
          registry,
          context: {
            publicBasePath: this.app.publicBasePath,
            credentials: container.resolve(mailCredentialVaultToken),
          },
          resolveConfig: (account) =>
            this.resolveProviderConfig(account.provider),
        }),
    );
    this.app.container.singleton(mailRuntimeToken, (container) =>
      createMailRuntime({
        store: container.resolve(mailStoreToken),
        adapters: container.resolve(mailProviderAdapterResolverToken),
        executor: this.resolveJobExecutor(container),
        automaticSyncIntervalMs: this.getMailConfig().automaticSyncIntervalMs,
        syncBatchSize: this.getMailConfig().syncBatchSize,
        pushWebhookUrl: this.getMailConfig().pushWebhookUrl,
        pushWebhookSecret: this.getMailConfig().pushWebhookSecret,
        outboundAttachments: container.resolve(
          mailOutboundAttachmentStorageToken,
        ),
        credentials: container.resolve(mailCredentialVaultToken),
        logger: container
          .resolve(loggingToken)
          .getLogger()
          .child({ module: 'mail' }),
        messageChangeNotifier: this.messageChangeNotifier,
      }),
    );
    this.app.container.singleton(
      mailOutboundAttachmentStorageToken,
      (container) =>
        new DriveMailOutboundAttachmentStorage(
          container.resolve(mailStoreToken),
          container.resolve(driveManagerToken),
          this.app.config.get<AppDriveConfig>('drive')!.default,
        ),
    );
    this.app.container.singleton(
      mailServiceToken,
      (container) =>
        new DefaultMailService({
          logger: container
            .resolve(loggingToken)
            .getLogger()
            .child({ module: 'mail' }),
          users: container.resolve(userAdministrationServiceToken),
          store: container.resolve(mailStoreToken),
          adapters: container.resolve(mailProviderAdapterResolverToken),
          outbox: container.resolve(mailRuntimeToken),
          syncBatchSize: this.getMailConfig().syncBatchSize,
          defaultAutomaticSyncIntervalMinutes:
            resolveMailAutomaticSyncIntervalFromMs(
              this.getMailConfig().automaticSyncIntervalMs,
            ),
          registry,
          providerContext: {
            publicBasePath: this.app.publicBasePath,
            credentials: container.resolve(mailCredentialVaultToken),
          },
          credentials: container.resolve(mailCredentialVaultToken),
          resolveProviderConfig: (provider) =>
            this.resolveProviderConfig(provider),
          listProviderConfigs: () => this.listProviderConfigs(),
          outboundAttachments: container.resolve(
            mailOutboundAttachmentStorageToken,
          ),
          messageChangeNotifier: this.messageChangeNotifier,
        }),
    );
  }

  private resolveJobExecutor(container: ServiceResolver): JobExecutor {
    if (!container.has(jobExecutorServiceToken)) {
      throw new Error(
        'Mail runs synchronization and scheduled sending on the application jobs service. Add JobExecutorServiceProvider from @nocobase/app-server/jobs to server/app.ts.',
      );
    }
    return container
      .resolve(jobExecutorServiceToken)
      .getJobExecutor(this.name, this.jobsConfiguration());
  }

  /**
   * The `jobs` configuration `mail.jobs` names. The jobs service would fall back to `jobs.default` for a name it does
   * not know, which would put Mail's tasks on another backend without a word, so an unknown name refuses to start.
   */
  private jobsConfiguration(): string | undefined {
    const name = this.getMailConfig().jobs;
    if (name === undefined) return undefined;
    const jobs = this.app.config.get<Record<string, unknown>>('jobs');
    // `jobs.default` holds a key, not a configuration, so it is rejected too.
    const selected = jobs?.[name];
    if (!selected || typeof selected !== 'object') {
      throw new Error(
        `mail.jobs names "${name}", which is not a jobs configuration.`,
      );
    }
    return name;
  }

  public override boot(): Promise<void> {
    if (this.app.container.has(realtimeServiceToken)) {
      this.realtimeTopic = this.app.container
        .resolve(realtimeServiceToken)
        .defineTopic<MailRealtimeEvent, 'user'>(MAIL_REALTIME_TOPIC, {
          audience: 'user',
        });
    }
    return Promise.resolve();
  }

  private listProviderConfigs(): readonly import('../../shared/mail.js').MailProviderConfig[] {
    return Object.entries(this.getMailConfig().providers).map(
      ([name, config]) => ({ ...config, name }),
    );
  }

  private resolveProviderConfig(
    provider: import('../../shared/mail.js').MailProviderIdentity,
  ): import('../../shared/mail.js').MailProviderConfig {
    const config = this.getMailConfig().providers[provider.name];
    if (!config || config.type !== provider.type || config.enabled === false) {
      throw mailFailedPrecondition(
        'MAIL_PROVIDER_UNAVAILABLE',
        `Mail Provider configuration "${provider.name}" is unavailable.`,
      );
    }
    return { ...config, name: provider.name };
  }

  private getMailConfig(): MailConfig {
    const raw = this.app.config.get<unknown>('mail');
    const resolved = resolveMailConfig(raw);
    if (
      raw === undefined &&
      !this.missingMailConfigWarningLogged &&
      this.app.container.has(loggingToken)
    ) {
      this.app.container
        .resolve(loggingToken)
        .getLogger()
        .warn(
          { namespace: 'mail' },
          'Mail configuration is not registered; using built-in defaults. Add mailConfig to server/config/index.ts to configure providers.',
        );
      this.missingMailConfigWarningLogged = true;
    }
    return resolved;
  }

  public override async start(): Promise<void> {
    await this.app.container.resolve(mailRuntimeToken).start();
  }

  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(mailRuntimeToken)?.close();
    this.realtimeTopic?.close();
    this.realtimeTopic = undefined;
  }
}
