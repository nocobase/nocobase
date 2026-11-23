/**
 * What Mail offers to be granted, shared by the server, which registers these resources with the authorization plugin
 * and checks them on every `/api/mail` route, and the client, whose pages declare the same requirements as their
 * `authz`.
 *
 * | Resource                   | Action    | Allows                                                                     |
 * | -------------------------- | --------- | -------------------------------------------------------------------------- |
 * | `page` `mail.workspace`    | `access`  | the caller's own mail: accounts, messages, drafts, sending, own logs       |
 * | `mail` `mail.management`   | `view`    | Team mail: read every member's synchronized messages without changing them |
 * | `mail` `mail.management`   | `process` | Team mail: mark read, star, archive or move members' messages (batchApply) |
 * | `settings` `mail.admin`    | `read`    | Mail settings: Providers, every account's status, every sync and send log  |
 * | `settings` `mail.admin`    | `manage`  | Mail settings: retry or cancel another member's synchronization or send    |
 *
 * `process` and `manage` do not include `view` and `read`: a role that should act also needs the read level, which
 * opens the page.
 */

/** The namespace of every title below, in the plugin's locales under `access.*`. */
export const MAIL_ACCESS_NAMESPACE = '@nocobase/app-plugin-mail';

/** The resource type of Team mail, registered by this plugin so it can offer two levels. */
export const MAIL_RESOURCE_TYPE = 'mail';

/** The permission workspace subsections Mail fills: Team mail under pages, Mail settings under administration. */
export const MAIL_PAGES_SECTION = 'pages.mail';
export const MAIL_SETTINGS_SECTION = 'mail';

export interface MailAccessRequirement {
  readonly resource: { readonly type: string; readonly id: string };
  readonly action: string;
}

function requirement(
  type: string,
  id: string,
  action: string,
): MailAccessRequirement {
  return Object.freeze({
    resource: Object.freeze({ type, id }),
    action,
  });
}

export const MAIL_WORKSPACE_PAGE = 'mail.workspace';
export const MAIL_TEAM_RESOURCE = 'mail.management';
export const MAIL_SETTINGS_ITEM = 'mail.admin';

export const MAIL_TEAM_ACTIONS = ['view', 'process'] as const;
export const MAIL_SETTINGS_ACTIONS = ['read', 'manage'] as const;

export const MAIL_ACCESS: {
  /** Mail and the personal Mail accounts page: the caller's own mail. */
  readonly workspace: MailAccessRequirement;
  /** Team mail, read only. */
  readonly teamView: MailAccessRequirement;
  /** Team mail batch actions. */
  readonly teamProcess: MailAccessRequirement;
  /** Mail settings, read only. */
  readonly settingsRead: MailAccessRequirement;
  /** Retrying and cancelling other members' synchronizations and sends. */
  readonly settingsManage: MailAccessRequirement;
} = Object.freeze({
  workspace: requirement('page', MAIL_WORKSPACE_PAGE, 'access'),
  teamView: requirement(MAIL_RESOURCE_TYPE, MAIL_TEAM_RESOURCE, 'view'),
  teamProcess: requirement(MAIL_RESOURCE_TYPE, MAIL_TEAM_RESOURCE, 'process'),
  settingsRead: requirement('settings', MAIL_SETTINGS_ITEM, 'read'),
  settingsManage: requirement('settings', MAIL_SETTINGS_ITEM, 'manage'),
});

/** `type:id/action`, how a requirement is named in API descriptions and errors. */
export function mailAccessKey(requirement: MailAccessRequirement): string {
  return `${requirement.resource.type}:${requirement.resource.id}/${requirement.action}`;
}

/** A title as the authorization plugin stores it: an i18n key in this plugin's namespace. */
export function mailAccessText(key: string): {
  readonly key: string;
  readonly ns: string;
} {
  return { key: `access.${key}`, ns: MAIL_ACCESS_NAMESPACE };
}
