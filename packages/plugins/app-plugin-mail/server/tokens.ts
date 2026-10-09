import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type {
  MailCredentialVault,
  MailProviderAdapterResolver,
  MailProviderRegistry,
} from './contracts/provider.js';
import type { MailOutboundAttachmentStorage } from '../shared/mail.js';
import type { MailService, MailRuntimeService } from './contracts/service.js';
import type { MailStore } from './contracts/persistence.js';

export const mailServiceToken: ServiceToken<MailService> =
  createServiceToken<MailService>('@nocobase/app-plugin-mail/service');

export const mailStoreToken: ServiceToken<MailStore> =
  createServiceToken<MailStore>('@nocobase/app-plugin-mail/store');

export const mailCredentialVaultToken: ServiceToken<MailCredentialVault> =
  createServiceToken<MailCredentialVault>(
    '@nocobase/app-plugin-mail/credential-vault',
  );

export const mailProviderRegistryToken: ServiceToken<MailProviderRegistry> =
  createServiceToken<MailProviderRegistry>(
    '@nocobase/app-plugin-mail/provider-registry',
  );

export const mailProviderAdapterResolverToken: ServiceToken<MailProviderAdapterResolver> =
  createServiceToken<MailProviderAdapterResolver>(
    '@nocobase/app-plugin-mail/provider-adapter-resolver',
  );

export const mailRuntimeToken: ServiceToken<MailRuntimeService> =
  createServiceToken<MailRuntimeService>('@nocobase/app-plugin-mail/runtime');

export const mailOutboundAttachmentStorageToken: ServiceToken<MailOutboundAttachmentStorage> =
  createServiceToken<MailOutboundAttachmentStorage>(
    '@nocobase/app-plugin-mail/outbound-attachment-storage',
  );
