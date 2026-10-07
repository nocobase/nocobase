/** A registry's settings as a form holds them, and as the API takes them. */
import type {
  RegistryInput,
  RegistryRecord,
  RegistrySecretKey,
} from '../../shared/releases.js';

export type PasswordInput =
  | { readonly mode: 'keep' }
  | { readonly mode: 'clear' }
  | { readonly mode: 'replace'; readonly value: string };

/** What the fields hold. */
export interface RegistryDraft {
  readonly url: string;
  readonly namespace: string;
  readonly pullUsername: string;
  readonly pullPassword: PasswordInput;
}

export function registryDraft(registry?: RegistryRecord): RegistryDraft {
  return {
    url: registry?.url ?? '',
    namespace: registry?.namespace ?? '',
    pullUsername: registry?.pullUsername ?? '',
    pullPassword: { mode: 'keep' },
  };
}

/** The draft as the API takes it, without the registry's ID. */
export function registryInput(
  draft: RegistryDraft,
  name: string,
): RegistryInput {
  const secretChanges: Partial<Record<RegistrySecretKey, string | null>> = {};
  if (draft.pullPassword.mode === 'clear') secretChanges.pullPassword = null;
  if (draft.pullPassword.mode === 'replace' && draft.pullPassword.value)
    secretChanges.pullPassword = draft.pullPassword.value;
  return {
    name: name.trim(),
    url: draft.url.trim(),
    namespace: draft.namespace.trim() || null,
    pullUsername: draft.pullUsername.trim() || null,
    ...(Object.keys(secretChanges).length > 0 ? { secretChanges } : {}),
  };
}

/** A name and an ID for a registry added without asking for them: its host and namespace, unique among `taken`. */
export function registryIdentity(
  draft: RegistryDraft,
  taken: readonly string[],
): { readonly id: string; readonly name: string } {
  const host = draft.url
    .trim()
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/\/.*$/, '');
  const name = [host, draft.namespace.trim()].filter(Boolean).join('/');
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^[-_]+|-+$/g, '')
      .slice(0, 56) || 'registry';
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return { id, name: name || id };
}
