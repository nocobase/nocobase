import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Context,
} from 'react';

import type { DemoConfigurationView } from '../../shared/configuration.js';
import type { DemoSettingsComponents } from './components.js';
import { DEMO_MODE_NAMESPACE } from '../namespace.js';

/** What a registered item is called in the application's language. */
export type DemoLabelKind =
  'count' | 'capability' | 'scope' | 'adapter' | 'chatTool';

/** An online chat tool the application lets administrators allow, and the policies it supports. */
export interface DemoChatTool {
  readonly id: string;
  readonly policies: readonly ('read' | 'mock')[];
}

export interface DemoSettingsOptions {
  /** Optional host page chrome and primitives; keep component identities stable across renders. */
  readonly components?: DemoSettingsComponents;
  /**
   * The application's name for a registered item, such as a dataset count (`count`, `companies`) or a write
   * capability (`capability`, `crm.leads`); `undefined` falls back to the title it registered with, or its id.
   */
  readonly label?: (kind: DemoLabelKind, id: string) => string | undefined;
  /** The online chat tools the application serves; tools a saved policy names are shown too. */
  readonly chatTools?: readonly DemoChatTool[];
  /**
   * Called when the demo data changed under the page: a clear answered, or an import or reset it watched finished.
   * An application refreshes what it caches, such as its query cache.
   */
  readonly onDataChange?: () => void;
}

export const DemoSettingsContext: Context<DemoSettingsOptions> =
  createContext<DemoSettingsOptions>({});

export function useT(): (
  key: string,
  values?: Record<string, unknown>,
) => string {
  const { t } = useTranslation(DEMO_MODE_NAMESPACE);
  return (key, values) => t(`settings.${key}`, values);
}

/** An item's name: the application's label, else what it registered as, else its id. */
export function useLabel(): (
  kind: DemoLabelKind,
  id: string,
  registered?: string,
) => string {
  const { label } = useContext(DemoSettingsContext);
  return (kind, id, registered) => label?.(kind, id) ?? registered ?? id;
}

/** A language's own name, such as 简体中文 for zh-CN. */
export function languageName(language: string): string {
  try {
    return (
      new Intl.DisplayNames([language], { type: 'language' }).of(language) ??
      language
    );
  } catch {
    return language;
  }
}

/** A sentence for a failed request: the known reasons first, then the server's own translated message. */
export function useErrorText(): (error: unknown) => string {
  const t = useT();
  return (error) => {
    if (!(error instanceof ApiClientError)) return t('errors.failed');
    const known: Record<string, string> = {
      DEMO_CONFIGURATION_CONFLICT: 'errors.conflict',
      DEMO_DATA_BUSY: 'errors.busy',
      DEMO_DATA_EXISTS: 'errors.exists',
      DEMO_MODE_REQUIRED: 'errors.demoModeRequired',
      DEMO_DATA_ACCOUNT_CONFLICT: 'errors.accountConflict',
      DEMO_DATA_UNAVAILABLE: 'errors.unavailable',
    };
    const reason = error.reason ? known[error.reason] : undefined;
    if (reason) return t(reason);
    if (error.status === 401) return t('errors.signedOut');
    if (error.status === 403) return t('errors.denied');
    const localized = (
      error.payload as
        { error?: { localizedMessage?: { message?: unknown } } } | undefined
    )?.error?.localizedMessage;
    return typeof localized?.message === 'string' && localized.message.trim()
      ? localized.message
      : t('errors.failed');
  };
}

/** The configuration the sections edit, and how they report back to the page. */
export interface Configuration {
  readonly view: DemoConfigurationView;
  readonly canEdit: boolean;
  /** Takes the view a save answered with. */
  readonly onSaved: (view: DemoConfigurationView) => void;
  readonly reload: () => Promise<void>;
  /** Tells the page whether a section holds unsaved changes, so leaving it asks first. */
  readonly onDirty: (id: string, dirty: boolean) => void;
}

export type ConfigurationPath =
  'writeRules' | 'collections' | 'mocks' | 'schedule' | 'chat';

/** What a settings card needs from a section's draft to show its save bar. */
export interface DraftControls {
  readonly dirty: boolean;
  readonly conflict: boolean;
  readonly saving: boolean;
  readonly error: unknown;
  readonly discard: () => void;
  readonly save: () => Promise<boolean>;
}

/** A section's draft and what saves or discards it. */
export interface Draft<T> extends DraftControls {
  readonly draft: T;
  readonly setDraft: (value: T) => void;
}

export interface Confirmation {
  readonly title: string;
  readonly description: string;
  readonly changes: readonly string[];
  readonly destructive?: boolean;
}

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * A section's draft of one configuration value, saved on its own with the revision it was started from: a save
 * another administrator made in between is refused (`DEMO_CONFIGURATION_CONFLICT`) rather than overwritten.
 */
export function useDraft<T>(
  id: string,
  path: ConfigurationPath,
  server: T,
  configuration: Configuration,
): Draft<T> {
  const api = useApiClient();
  const { view, onSaved, onDirty } = configuration;
  const [base, setBase] = useState({ value: server, revision: view.revision });
  const [draft, setDraft] = useState(server);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>();
  const dirty = !same(draft, base.value);
  // Another save changed this value while it is being edited.
  const conflict = dirty && !same(server, base.value);
  const [seen, setSeen] = useState(view.revision);
  if (seen !== view.revision) {
    setSeen(view.revision);
    if (!dirty) {
      setBase({ value: server, revision: view.revision });
      setDraft(server);
    } else if (same(server, base.value))
      setBase({ value: base.value, revision: view.revision });
  }
  useEffect(() => {
    onDirty(id, dirty);
    return () => onDirty(id, false);
  }, [dirty, id, onDirty]);
  const discard = (): void => {
    setBase({ value: server, revision: view.revision });
    setDraft(server);
    setError(undefined);
  };
  const save = async (): Promise<boolean> => {
    setSaving(true);
    setError(undefined);
    try {
      const { data } = await api.request<{ data: DemoConfigurationView }>({
        path: `/demoMode/configuration/${path}`,
        method: 'PUT',
        json: { expectedRevision: base.revision, value: draft },
      });
      setBase({ value: draft, revision: data.revision });
      onSaved(data);
      return true;
    } catch (cause) {
      setError(cause);
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { draft, setDraft, dirty, conflict, saving, error, discard, save };
}
