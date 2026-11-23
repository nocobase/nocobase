/** Safe public views: never include recipients, credentials, or raw transport configuration. */
export interface NotificationTemplateContent {
  readonly title: string;
  readonly body: string;
  readonly html?: string;
}

/**
 * Administrator-facing text. A plain string is shown as authored in every interface language. A translation key is
 * resolved by the browser in the interface language, from the client locale resources of `ns`, falling back to
 * `defaultValue` when that namespace is not loaded or lacks the key. Same shape as `NotificationI18nText`.
 */
export type NotificationTemplateText =
  | string
  | {
      readonly ns: string;
      readonly key: string;
      readonly defaultValue: string;
    };

/**
 * How the message handles languages. `separate`: one message per language, chosen per send. `combined`: a single
 * message containing every declared language, so every recipient receives the same content.
 */
export type NotificationTemplateLocaleMode = 'separate' | 'combined';

export interface NotificationTemplateChannel {
  /** Configured channel name; a technical identifier shown only as secondary information. */
  readonly name: string;
  readonly type: string;
  /** Display name of this channel, for example "Inbox". */
  readonly label?: NotificationTemplateText;
  /** Display name of the channel type, for example "In-app message" or "Email". */
  readonly typeLabel?: NotificationTemplateText;
  /** Configuration exists; this does not assert remote connectivity. */
  readonly configured: boolean;
  readonly enabled: boolean | null;
}

/**
 * How a notification kind uses a channel type: `required` always sends and a person cannot turn it off, `on` sends
 * unless the person turned it off, `off` sends only when the person turned it on. The in-app inbox is always `required`.
 */
export type NotificationChannelPolicy = 'required' | 'on' | 'off';

/** A kind's policy for one channel type, such as `email`. */
export interface NotificationKindChannelPolicy {
  /** The channel type (message family): `in-app`, `email`, `web-push`. */
  readonly type: string;
  readonly policy: NotificationChannelPolicy;
  /** Whether a person may change it: every policy except `required`. */
  readonly adjustable: boolean;
}

export interface NotificationTemplateView {
  readonly id: string;
  /** Package that registered the template; a technical identifier. */
  readonly contributor: string;
  /** Display name of the registering module, for example "Users". */
  readonly contributorLabel?: NotificationTemplateText;
  readonly category: NotificationTemplateText;
  /** The category's stable key, which the inbox filters by, such as `approval`. */
  readonly categoryKey: string;
  readonly name: NotificationTemplateText;
  readonly trigger: NotificationTemplateText;
  readonly recipients: NotificationTemplateText;
  readonly businessRule: NotificationTemplateText;
  readonly locales: readonly string[];
  readonly localeMode: NotificationTemplateLocaleMode;
  readonly languagePolicy: NotificationTemplateText;
  readonly variables: readonly {
    readonly name: string;
    readonly description: NotificationTemplateText;
  }[];
  readonly channels: readonly NotificationTemplateChannel[];
  /**
   * The kind's channel policies, when it is sent with `notify()`. Absent for a template its owner sends itself (an
   * invitation to an email address), which is listed for reference only and has no personal preference.
   */
  readonly policies?: readonly NotificationKindChannelPolicy[];
}

/** A notification kind is the template directory entry `notify()` sends; the two names describe one view. */
export type NotificationKindView = NotificationTemplateView;

export interface NotificationTemplatePreview {
  readonly synthetic: true;
  readonly requestedLocale: string;
  readonly effectiveLocale: string;
  readonly content: NotificationTemplateContent;
  readonly definition: NotificationTemplateContent;
}

/** The text in the template's authored default language, for server-side search and logs. */
export function notificationTemplateDefaultText(
  text: NotificationTemplateText,
): string {
  return typeof text === 'string' ? text : text.defaultValue;
}
