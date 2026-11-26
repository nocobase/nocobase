import { ClientApplicationContext } from '@nocobase/app-client';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import { useContext, type ComponentType } from 'react';

import type {
  MailComposerCompletionCallback,
  MailComposerState,
} from './contracts/composer.js';
import type {
  MailAccountView,
  MailMessage,
  MailProviderView,
} from '../shared/mail.js';

/**
 * What an application or a business plugin adds to the plugin's own Mail pages, registered once while the client
 * boots: resolve `mailExtensionsToken` in a client service provider's `boot()` and call `add` on the registry you
 * need. Every registry rejects a second entry under the same name, key or type. Props of `MailWorkspacePage` that do
 * the same still work and are combined with what is registered here.
 *
 * ```ts
 * const mail = this.app.container.resolve(mailExtensionsToken);
 * mail.slots.messageAside.add({ name: 'crm', component: CustomerAside });
 * mail.templateVariables.add({ key: 'customer', label: 'Customer', resolve: ({ to }) => lookUp(to) });
 * ```
 */
export class MailExtensions {
  /** Titles, icons and optional connection forms of Provider types, by the server's Provider `type`. */
  public readonly providerTypes: MailExtensionRegistry<MailProviderTypeDefinition> =
    new MailExtensionRegistry('Mail Provider type', (entry) => entry.type);
  public readonly slots: {
    /** Beside the open message, such as the customer its addresses belong to. Not rendered when nothing is registered. */
    readonly messageAside: MailExtensionRegistry<
      MailSlotDefinition<MailMessageAsideProps>
    >;
    /** Below the message body while composing, such as a button that inserts a quote. */
    readonly composeToolbar: MailExtensionRegistry<
      MailSlotDefinition<MailComposeToolbarProps>
    >;
    /** In the Mail page header after Compose and Sync, which they never replace. */
    readonly workspaceActions: MailExtensionRegistry<
      MailSlotDefinition<MailWorkspaceActionProps>
    >;
  } = Object.freeze({
    messageAside: new MailExtensionRegistry<
      MailSlotDefinition<MailMessageAsideProps>
    >('Mail message aside', (entry) => entry.name),
    composeToolbar: new MailExtensionRegistry<
      MailSlotDefinition<MailComposeToolbarProps>
    >('Mail compose toolbar item', (entry) => entry.name),
    workspaceActions: new MailExtensionRegistry<
      MailSlotDefinition<MailWorkspaceActionProps>
    >('Mail workspace action', (entry) => entry.name),
  });
  /** Values for `{{key}}` placeholders when a template is applied; a `templateVariables` prop of the same key wins. */
  public readonly templateVariables: MailExtensionRegistry<MailTemplateVariableDefinition> =
    new MailExtensionRegistry('Mail template variable', (entry) => entry.key);
  public readonly composer: {
    /** Called after the plugin's Mail page sends, schedules or saves a message, after the page's own handling. */
    readonly onComplete: MailCompletionHandlers;
  } = Object.freeze({ onComplete: new MailCompletionHandlers() });
}

/** One kind of registration, kept in `order`, then registration order. */
export class MailExtensionRegistry<T extends { readonly order?: number }> {
  private readonly entries = new Map<string, T>();

  public constructor(
    private readonly kind: string,
    private readonly keyOf: (entry: T) => string,
  ) {}

  /** Registers an entry and returns a function that removes it. */
  public add(entry: T): () => void {
    const key = this.keyOf(entry);
    if (!key) throw new TypeError(`A ${this.kind} needs a name.`);
    if (this.entries.has(key))
      throw new Error(`${this.kind} "${key}" is already registered.`);
    this.entries.set(key, Object.freeze({ ...entry }));
    return () => {
      this.entries.delete(key);
    };
  }

  public get(key: string): T | undefined {
    return this.entries.get(key);
  }

  public list(): readonly T[] {
    return [...this.entries.values()].sort(
      (left, right) => (left.order ?? 0) - (right.order ?? 0),
    );
  }
}

/** Completion handlers, called in registration order. */
export class MailCompletionHandlers {
  private readonly handlers = new Set<MailComposerCompletionCallback>();

  /** Registers a handler and returns a function that removes it. */
  public add(handler: MailComposerCompletionCallback): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  public list(): readonly MailComposerCompletionCallback[] {
    return [...this.handlers];
  }
}

export interface MailSlotDefinition<TProps> {
  /** Unique within its slot. */
  readonly name: string;
  /** Lower first; defaults to 0. */
  readonly order?: number;
  readonly component: ComponentType<TProps>;
}

export interface MailProviderTypeDefinition {
  /** The server's Provider `type`, such as `crm-gateway`. Only types the server offers appear. */
  readonly type: string;
  /** Shown instead of the server's label, already translated. */
  readonly title?: string;
  readonly icon?: ComponentType<{ readonly className?: string }>;
  /** Replaces the built-in OAuth button or credentials form when connecting an account of this type. */
  readonly connect?: ComponentType<MailProviderConnectProps>;
  readonly order?: number;
}

export interface MailProviderConnectProps {
  readonly provider: MailProviderView;
  /** The first day to synchronize, `YYYY-MM-DD`, as the person chose it. */
  readonly receivedAfter: string;
  /** Call once the account exists, so the page reloads it. */
  readonly onConnected: (account?: MailAccountView) => void;
}

export interface MailMessageAsideProps {
  readonly message: MailMessage;
  /** The message's From, To and Cc addresses, lower-cased and without duplicates. */
  readonly addresses: readonly string[];
}

export interface MailComposeToolbarProps {
  readonly accountId: string;
  readonly state: Pick<
    MailComposerState,
    'mode' | 'to' | 'cc' | 'bcc' | 'subject' | 'text' | 'html'
  >;
  /** Appends a paragraph of plain text to the body. */
  readonly insertText: (text: string) => void;
  /** Appends HTML to the body; it is sanitized when the message is rendered. */
  readonly insertHtml: (html: string) => void;
  /** Whether the composer is sending or uploading, so the item should be disabled. */
  readonly disabled: boolean;
}

export interface MailWorkspaceActionProps {
  readonly accounts: readonly MailAccountView[];
  /** The account the page shows; empty for every account. */
  readonly accountId: string;
  readonly selectedMessage?: MailMessage;
  /** Reloads the page's accounts and messages. */
  readonly reload: () => void;
}

export interface MailTemplateVariableContext {
  readonly accountId: string;
  /** The To addresses as typed, separated by commas. */
  readonly to: string;
}

export interface MailTemplateVariableDefinition {
  /** The placeholder, `customer` for `{{customer}}` or `{{customer.name}}`. */
  readonly key: string;
  /** Shown to people choosing variables, already translated. */
  readonly label: string;
  readonly resolve: (context: MailTemplateVariableContext) => unknown;
  readonly order?: number;
}

export const mailExtensionsToken: ServiceToken<MailExtensions> =
  createServiceToken<MailExtensions>('@nocobase/app-plugin-mail/extensions');

const NO_EXTENSIONS = new MailExtensions();

/**
 * The registered extensions, or an empty set outside an application or before the plugin registered them, so the
 * exported components keep working on their own.
 */
export function useMailExtensions(): MailExtensions {
  const app = useContext(ClientApplicationContext);
  const services = app?.services;
  return services?.has(mailExtensionsToken)
    ? services.resolve(mailExtensionsToken)
    : NO_EXTENSIONS;
}

/** Resolves every registered variable for one template application; a failing one is left out. */
export async function resolveMailTemplateVariables(
  extensions: MailExtensions,
  context: MailTemplateVariableContext,
): Promise<Readonly<Record<string, unknown>>> {
  const values: Record<string, unknown> = {};
  for (const variable of extensions.templateVariables.list()) {
    try {
      values[variable.key] = await variable.resolve(context);
    } catch {
      // A business lookup that fails leaves its placeholder unresolved rather than blocking the template.
    }
  }
  return values;
}
