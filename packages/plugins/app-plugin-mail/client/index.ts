export { default } from './plugin.js';
export { MailClient, mailErrorMessage } from './mail-client.js';
export type * from './mail-client.js';
export { prepareMailReply } from './prepare-mail-reply.js';
export type { MailComposerRequest } from './contracts/composer.js';
export {
  useMailUnreadCount,
  type MailUnreadCountState,
} from './hooks/use-mail-unread-count.js';
export {
  htmlToPlainText,
  plainTextToMailHtml,
  renderMailTemplate,
} from './lib/mail-template.js';
export type {
  MailTemplateVariables,
  RenderedMailTemplate,
} from './lib/mail-template.js';
export { default as MailWorkspacePage } from './pages/mail-workspace-page.js';
export type { MailWorkspacePageProps } from './pages/mail-workspace-page.js';
export { default as MailAccountsPage } from './pages/mail-accounts-page.js';
export type { MailAccountsPageProps } from './pages/mail-accounts-page.js';
export { MAIL_PLUGIN_NS } from './namespace.js';
export {
  MAIL_REALTIME_TOPIC,
  type MailRealtimeEvent,
} from '../shared/realtime.js';
export { mailClientToken, useMailClient } from './runtime.js';
export {
  DEFAULT_MAIL_LABEL_COLOR,
  MAIL_LABEL_COLORS,
  MAIL_VIRTUAL_FOLDER_IDS,
} from '../shared/mail.js';
export {
  MailCompletionHandlers,
  MailExtensionRegistry,
  MailExtensions,
  mailExtensionsToken,
  useMailExtensions,
} from './extensions.js';
export type {
  MailComposeToolbarProps,
  MailMessageAsideProps,
  MailProviderConnectProps,
  MailProviderTypeDefinition,
  MailSlotDefinition,
  MailTemplateVariableContext,
  MailTemplateVariableDefinition,
  MailWorkspaceActionProps,
} from './extensions.js';
export { mailRoutes } from './routes.js';
export type { MailNavigationOptions, MailRouteOptions } from './routes.js';
export type { MailClientOptions } from './plugin.js';
export { MAIL_ACCESS } from '../shared/access.js';
