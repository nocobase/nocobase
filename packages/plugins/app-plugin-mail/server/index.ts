export { default } from './plugin.js';
export {
  DEFAULT_MAIL_CONFIG,
  mailEnvironmentMappings,
  mailConfig,
  resolveMailConfig,
} from './config.js';
export type { MailConfig } from './config.js';
export {
  mailCredentialVaultToken,
  mailProviderRegistryToken,
  mailServiceToken,
} from './tokens.js';
export { createMailProviderRegistry } from './registry.js';
export { defineMailProviderDefinition } from './contracts/provider.js';
export type * from './public-types.js';
export type { MailProviderConfigEntry } from './config.js';
export {
  MAIL_PROVIDER_CAPABILITIES,
  MAIL_PROVIDER_ERROR_CATEGORIES,
} from '../shared/mail.js';
export type { GmailMailProviderConfig } from './adapters/gmail/types.js';
export type { MicrosoftMailProviderConfig } from './adapters/microsoft/types.js';
export type {
  ImapSmtpEndpointConfig,
  ImapSmtpMailProviderConfig,
} from './adapters/imap-smtp/config.js';
