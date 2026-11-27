import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type {
  NotificationChannelPolicy,
  NotificationKindChannelPolicy,
  NotificationTemplateContent,
  NotificationTemplatePreview,
  NotificationTemplateText,
  NotificationTemplateView,
} from '../shared/templates.js';
import { notificationTemplateDefaultText } from '../shared/templates.js';
import type { NotificationConfigInput } from './types.js';

export type * from '../shared/templates.js';
export { notificationTemplateDefaultText } from '../shared/templates.js';

/** The data a kind's message is rendered from: the values `notify()` was given. */
export type NotificationKindData = Readonly<Record<string, unknown>>;

export interface NotificationTemplateDefinition extends Omit<
  NotificationTemplateView,
  'channels' | 'localeMode' | 'categoryKey' | 'policies'
> {
  /** Defaults to `separate`. Declare `combined` when one message carries every declared locale. */
  readonly localeMode?: NotificationTemplateView['localeMode'];
  /**
   * The category's stable key, which the inbox filters by and stores on each message. Defaults to the category's
   * default text in lower case with spaces as dashes (`Tasks` → `tasks`); declare it when that text may change.
   */
  readonly categoryKey?: string;
  /**
   * A kind sent with `notify()` declares its policy per channel type: `{ 'in-app': 'required', 'web-push': 'on', email:
   * 'off' }`. The settings page lists the configured channels of those types. A template its owner sends itself with
   * `send()` declares instead a safe projection of the channels it uses, read from current configuration only (no
   * transport creation or probes); it is listed for reference and has no personal preference.
   */
  readonly channels:
    | Readonly<Record<string, NotificationChannelPolicy>>
    | (() => NotificationTemplateView['channels']);
  /**
   * The message of one send, for `notify()`: required with channel policies. Pure: no I/O or business record lookup,
   * everything it needs comes in `data`. `locale` is the application's default language when the kind declares it,
   * otherwise the kind's first locale.
   */
  readonly content?: (input: {
    readonly locale: string;
    readonly data: NotificationKindData;
  }) => NotificationTemplateContent | Promise<NotificationTemplateContent>;
  /**
   * Synthetic data for the preview, rendered with `content`. The definition view then renders `content` with each
   * variable as `{{name}}`. Give either `sample` or `render`.
   */
  readonly sample?: NotificationKindData;
  /** Both callbacks must use the real sender's pure renderer, without I/O or business record lookup. */
  readonly render?: (
    locale: string,
    example: 'definition' | 'sample',
  ) => NotificationTemplateContent | Promise<NotificationTemplateContent>;
}

/** A notification kind: a template directory entry with channel policies, which `notify()` sends. */
export type NotificationKindDefinition = NotificationTemplateDefinition;

/** What `notify()` reads of a kind. */
export interface NotificationKindRuntime {
  readonly view: NotificationTemplateView;
  readonly policies: readonly NotificationKindChannelPolicy[];
  render(
    locale: string,
    data: NotificationKindData,
  ): Promise<NotificationTemplateContent>;
}

export interface NotificationTemplateRegistryOptions {
  /**
   * The configured channels of the given channel types, for a kind that declares channel policies. The notification
   * plugin reads them from `notification.channels`; without it such a kind lists none.
   */
  readonly channelsOfTypes?: (
    types: readonly string[],
  ) => NotificationTemplateView['channels'];
}

const CHANNEL_POLICIES: readonly NotificationChannelPolicy[] = [
  'required',
  'on',
  'off',
];
/** The inbox is where every notification is kept, so a kind cannot make it optional. */
const ALWAYS_REQUIRED_CHANNEL_TYPES: ReadonlySet<string> = new Set(['in-app']);

/** Application-local, source-owned directory. Registration is independent of notification delivery. */
export class NotificationTemplateRegistry {
  private readonly definitions = new Map<
    string,
    NotificationTemplateDefinition
  >();

  constructor(
    private readonly options: NotificationTemplateRegistryOptions = {},
  ) {}

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
    validateKindShape(definition);
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

  /** The kind `notify()` sends, or `undefined` when no kind with channel policies has this id. */
  public kind(id: string): NotificationKindRuntime | undefined {
    const definition = this.definitions.get(id);
    if (!definition || typeof definition.channels === 'function')
      return undefined;
    const view = this.view(definition);
    return {
      view,
      policies: view.policies ?? [],
      render: async (locale, data) =>
        projectContent(
          await definition.content!({
            locale: definition.locales.includes(locale)
              ? locale
              : definition.locales[0],
            data,
          }),
        ),
    };
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
    const render = async (
      example: 'sample' | 'definition',
    ): Promise<NotificationTemplateContent> =>
      definition.render
        ? definition.render(effectiveLocale, example)
        : definition.content!({
            locale: effectiveLocale,
            data:
              example === 'sample'
                ? definition.sample!
                : Object.fromEntries(
                    definition.variables.map(({ name }) => [
                      name,
                      `{{${name}}}`,
                    ]),
                  ),
          });
    const [content, source] = await Promise.all([
      render('sample'),
      render('definition'),
    ]);
    return {
      synthetic: true,
      requestedLocale: locale,
      effectiveLocale,
      content: projectContent(content),
      definition: projectContent(source),
    };
  }

  private view(
    definition: NotificationTemplateDefinition,
  ): NotificationTemplateView {
    const policies =
      typeof definition.channels === 'function'
        ? undefined
        : Object.entries(definition.channels).map(
            ([type, declared]): NotificationKindChannelPolicy => {
              const policy = ALWAYS_REQUIRED_CHANNEL_TYPES.has(type)
                ? 'required'
                : declared;
              return { type, policy, adjustable: policy !== 'required' };
            },
          );
    const channels =
      typeof definition.channels === 'function'
        ? definition.channels()
        : (this.options.channelsOfTypes?.(policies!.map(({ type }) => type)) ??
          []);
    return {
      id: definition.id,
      contributor: definition.contributor,
      ...optionalText('contributorLabel', definition.contributorLabel),
      category: text(definition.category),
      categoryKey: definition.categoryKey ?? categoryKeyOf(definition.category),
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
      channels: channels.map(
        ({ name, type, label, typeLabel, configured, enabled }) => ({
          name,
          type,
          ...optionalText('label', label),
          ...optionalText('typeLabel', typeLabel),
          configured,
          enabled,
        }),
      ),
      ...(policies ? { policies } : {}),
    };
  }
}

/** Explicit allowlist, including callback results: transport-specific fields must not escape. */
function projectContent(
  value: NotificationTemplateContent,
): NotificationTemplateContent {
  return {
    title: value.title,
    body: value.body,
    ...(value.html === undefined ? {} : { html: value.html }),
  };
}

function categoryKeyOf(category: NotificationTemplateText): string {
  return (
    notificationTemplateDefaultText(category)
      .trim()
      .toLowerCase()
      .replace(/\s+/gu, '-')
      .slice(0, 100) || 'general'
  );
}

function validateKindShape(definition: NotificationTemplateDefinition): void {
  const { id, channels } = definition;
  if (
    definition.categoryKey !== undefined &&
    !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/u.test(definition.categoryKey)
  )
    throw new Error(
      `Notification kind "${id}" has an invalid category key; use letters, digits, ".", "_" or "-".`,
    );
  if (typeof channels === 'function') {
    if (!definition.render)
      throw new Error(`Notification template "${id}" requires render().`);
    return;
  }
  if (!channels || typeof channels !== 'object' || Array.isArray(channels))
    throw new Error(
      `Notification kind "${id}" channels must map channel types to policies.`,
    );
  const entries = Object.entries(channels);
  if (!entries.length)
    throw new Error(`Notification kind "${id}" declares no channel type.`);
  for (const [type, policy] of entries)
    if (!type.trim() || type.length > 64 || !CHANNEL_POLICIES.includes(policy))
      throw new Error(
        `Notification kind "${id}" has an invalid policy for channel type "${type}"; use required, on or off.`,
      );
  if (typeof definition.content !== 'function')
    throw new Error(`Notification kind "${id}" requires content().`);
  if (!definition.render && !definition.sample)
    throw new Error(
      `Notification kind "${id}" requires sample data or render() for its preview.`,
    );
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

/** The same registry under its newer name: register notification kinds here. */
export const notificationKindRegistryToken: ServiceToken<NotificationTemplateRegistry> =
  notificationTemplateRegistryToken;

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
