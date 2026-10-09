export { default } from './plugin.js';
export { MailClient, mailErrorMessage } from './mail-client.js';
export type * from './mail-client.js';
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
