import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type {
  NotificationTemplateContent,
  NotificationTemplatePreview,
  NotificationTemplateText,
  NotificationTemplateView,
} from '../shared/templates.js';
import type { NotificationConfigInput } from './types.js';

export type * from '../shared/templates.js';
export { notificationTemplateDefaultText } from '../shared/templates.js';

export interface NotificationTemplateDefinition extends Omit<
  NotificationTemplateView,
  'channels' | 'localeMode'
> {
  /** Defaults to `separate`. Declare `combined` when one message carries every declared locale. */
  readonly localeMode?: NotificationTemplateView['localeMode'];
  /** Safe projection of current configuration only. No transport creation or probes. */
  readonly channels: () => NotificationTemplateView['channels'];
  /** Both callbacks must use the real sender's pure renderer, without I/O or business record lookup. */
  readonly render: (
    locale: string,
    example: 'definition' | 'sample',
  ) => NotificationTemplateContent | Promise<NotificationTemplateContent>;
}

/** Application-local, source-owned directory. Registration is independent of notification delivery. */
export class NotificationTemplateRegistry {
  private readonly definitions = new Map<
    string,
    NotificationTemplateDefinition
  >();

  public register(definition: NotificationTemplateDefinition): () => void {
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,199}$/u.test(definition.id) ||
      !definition.locales.length
    )
      throw new Error(
        'Notification templates require a stable id and at least one locale.',
      );
    if (
      definition.localeMode !== undefined &&
      definition.localeMode !== 'separate' &&
      definition.localeMode !== 'combined'
    )
      throw new Error(
        `Notification template "${definition.id}" has an unknown locale mode.`,
      );
    if (this.definitions.has(definition.id))
      throw new Error(
        `Notification template "${definition.id}" is already registered.`,
      );
    this.definitions.set(definition.id, definition);
    return () => {
      if (this.definitions.get(definition.id) === definition)
        this.definitions.delete(definition.id);
    };
  }

  public list(): readonly NotificationTemplateView[] {
    return [...this.definitions.values()].map((definition) =>
      this.view(definition),
    );
  }

  public get(id: string): NotificationTemplateView | undefined {
    const definition = this.definitions.get(id);
    return definition ? this.view(definition) : undefined;
  }

  public async preview(
    id: string,
    locale: string,
  ): Promise<NotificationTemplatePreview | undefined> {
    const definition = this.definitions.get(id);
    if (!definition) return undefined;
    const effectiveLocale = definition.locales.includes(locale)
      ? locale
      : definition.locales[0];
    const [content, source] = await Promise.all([
      definition.render(effectiveLocale, 'sample'),
      definition.render(effectiveLocale, 'definition'),
    ]);
    // Explicit allowlist, including callback results: transport-specific fields must not escape.
    const project = (
      value: NotificationTemplateContent,
    ): NotificationTemplateContent => ({
      title: value.title,
      body: value.body,
      ...(value.html === undefined ? {} : { html: value.html }),
    });
    return {
      synthetic: true,
      requestedLocale: locale,
      effectiveLocale,
      content: project(content),
      definition: project(source),
    };
  }

  private view(
    definition: NotificationTemplateDefinition,
  ): NotificationTemplateView {
    return {
      id: definition.id,
      contributor: definition.contributor,
      ...optionalText('contributorLabel', definition.contributorLabel),
      category: text(definition.category),
      name: text(definition.name),
      trigger: text(definition.trigger),
      recipients: text(definition.recipients),
      businessRule: text(definition.businessRule),
      locales: [...definition.locales],
      localeMode: definition.localeMode ?? 'separate',
      languagePolicy: text(definition.languagePolicy),
      variables: definition.variables.map(({ name, description }) => ({
        name,
        description: text(description),
      })),
      channels: definition
        .channels()
        .map(({ name, type, label, typeLabel, configured, enabled }) => ({
          name,
          type,
          ...optionalText('label', label),
          ...optionalText('typeLabel', typeLabel),
          configured,
          enabled,
        })),
    };
  }
}

/** Explicit allowlist: a translation reference keeps only its namespace, key and default text. */
function text(value: NotificationTemplateText): NotificationTemplateText {
  return typeof value === 'string'
    ? value
    : { ns: value.ns, key: value.key, defaultValue: value.defaultValue };
}

function optionalText<TKey extends string>(
  key: TKey,
  value: NotificationTemplateText | undefined,
): Partial<Record<TKey, NotificationTemplateText>> {
  return value === undefined
    ? {}
    : ({ [key]: text(value) } as Record<TKey, NotificationTemplateText>);
}

export const notificationTemplateRegistryToken: ServiceToken<NotificationTemplateRegistry> =
  createServiceToken<NotificationTemplateRegistry>(
    '@nocobase/app-plugin-notification/templates',
  );

/** `display` carries the registrant's translatable channel and channel type names. */
export function describeNotificationTemplateChannel(
  config: NotificationConfigInput | undefined,
  name: string,
  display: {
    readonly label?: NotificationTemplateText;
    readonly typeLabel?: NotificationTemplateText;
  } = {},
): NotificationTemplateView['channels'][number] {
  const channel = config?.channels?.[name];
  return {
    name,
    ...optionalText('label', display.label),
    ...optionalText('typeLabel', display.typeLabel),
    type: channel
      ? 'type' in channel
        ? channel.type
        : channel.provider
      : 'unknown',
    configured: channel !== undefined,
    enabled: channel ? channel.enabled !== false : null,
  };
}
