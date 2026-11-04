/** Safe public views: never include recipients, credentials, or raw transport configuration. */
export interface NotificationTemplateContent {
  readonly title: string;
  readonly body: string;
  readonly html?: string;
}

export interface NotificationTemplateChannel {
  readonly name: string;
  readonly type: string;
  /** Configuration exists; this does not assert remote connectivity. */
  readonly configured: boolean;
  readonly enabled: boolean | null;
}

export interface NotificationTemplateView {
  readonly id: string;
  readonly contributor: string;
  readonly category: string;
  readonly name: string;
  readonly trigger: string;
  readonly recipients: string;
  readonly businessRule: string;
  readonly locales: readonly string[];
  readonly languagePolicy: string;
  readonly variables: readonly {
    readonly name: string;
    readonly description: string;
  }[];
  readonly channels: readonly NotificationTemplateChannel[];
}

export interface NotificationTemplatePreview {
  readonly synthetic: true;
  readonly requestedLocale: string;
  readonly effectiveLocale: string;
  readonly content: NotificationTemplateContent;
  readonly definition: NotificationTemplateContent;
}
