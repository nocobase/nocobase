import type { MailLogger } from '../logging.js';
import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import { type MailMessageChangeNotifier } from '../realtime.js';
import {
  type MailCredentialVault,
  type MailProviderAdapterResolver,
  type MailProviderContext,
  type MailProviderRegistry,
} from '../contracts/provider.js';
import {
  type MailOutboundAttachmentStorage,
  type MailProviderConfig,
} from '../../shared/mail.js';
import { type MailStore } from '../contracts/persistence.js';

export interface MailOutboxPublisher {
  kick(): void;
}

export interface DefaultMailServiceDependencies {
  readonly logger?: MailLogger;
  readonly users?: Pick<UserAdministrationService, 'list'>;
  readonly store: MailStore;
  readonly adapters: MailProviderAdapterResolver;
  readonly outbox: MailOutboxPublisher;
  readonly syncBatchSize?: number;
  readonly defaultAutomaticSyncIntervalMinutes?: number;
  readonly registry?: MailProviderRegistry;
  readonly providerContext?: MailProviderContext;
  readonly credentials?: MailCredentialVault;
  readonly resolveProviderConfig?: (
    provider: import('../../shared/mail.js').MailProviderIdentity,
  ) => MailProviderConfig;
  readonly listProviderConfigs?: () => readonly MailProviderConfig[];
  readonly outboundAttachments?: MailOutboundAttachmentStorage;
  readonly messageChangeNotifier?: MailMessageChangeNotifier;
}

/** Internal services declare persistence capabilities rather than the entire facade. */
export type MailServiceDependencies<
  Methods extends keyof MailStore,
  Extras extends Exclude<keyof DefaultMailServiceDependencies, 'store'>,
> = Pick<DefaultMailServiceDependencies, Extras> & {
  readonly store: Pick<MailStore, Methods>;
};
