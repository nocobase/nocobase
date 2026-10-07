/** Drafts of the config secrets a person replaces or clears (`components/config-secrets.tsx`), and what is sent. */
import type {
  ConfigPath,
  ConfigSecret,
  ConfigSecretChange,
} from '../../shared/releases.js';

/** What the person chose for one secret: keep it, type a new value, or remove it. */
export interface ConfigSecretDraft {
  readonly mode: 'replace' | 'clear';
  readonly value: string;
}

export type ConfigSecretDrafts = Readonly<Record<string, ConfigSecretDraft>>;

export function configPathKey(path: ConfigPath): string {
  return JSON.stringify(path);
}

/** The drafts as the API takes them; a replacement left empty is not sent. */
export function configSecretChanges(
  secrets: readonly ConfigSecret[],
  drafts: ConfigSecretDrafts,
): ConfigSecretChange[] {
  const changes: ConfigSecretChange[] = [];
  for (const secret of secrets) {
    const draft = drafts[configPathKey(secret.path)];
    if (draft?.mode === 'clear')
      changes.push({ path: secret.path, value: null });
    else if (draft?.mode === 'replace' && draft.value !== '')
      changes.push({ path: secret.path, value: draft.value });
  }
  return changes;
}
