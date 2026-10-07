/**
 * Key scopes as data: what a plugin declares it offers (permission groups and presets), what a key's scope holds, and
 * how a scope is stored in Better Auth's `permissions` column. Nothing here imports another plugin, so a plugin that
 * contributes a group writes a literal of the same shape without depending on this package.
 *
 * A scope only ever narrows: a key's effective permission is its owner's current permission intersected with the
 * scope. A key without a scope (`permissions = null`) is its owner, exactly as before scopes existed.
 */

/** A level of a group; each includes the ones before it. */
export type KeyScopeLevel = 'read' | 'write' | 'admin';

export const KEY_SCOPE_LEVELS: readonly KeyScopeLevel[] = [
  'read',
  'write',
  'admin',
];

/** A title as the authorization plugin stores it: plain text, or an i18n key in a namespace. */
export type LocalizedText =
  string | { readonly key: string; readonly ns: string };

/**
 * One permission a group level covers, in the vocabulary plugins already declare: a page (`access`), an action of a
 * settings item, or a business action. The application maps each to an authorization resource and action.
 */
export type AccessRef =
  | { readonly kind: 'page'; readonly id: string }
  | { readonly kind: 'settings'; readonly id: string; readonly action: string }
  | { readonly kind: 'business'; readonly id: string; readonly action: string };

/** The section a group is listed under, as GitHub lists repository, organization and account permissions. */
export type KeyScopeCategory = 'business' | 'administration' | 'account';

export interface KeyScopeGroupDeclaration {
  /** `<plugin>.<area>`, such as `releases.apps`. */
  readonly id: string;
  readonly category: KeyScopeCategory;
  readonly title: LocalizedText;
  readonly description?: LocalizedText;
  /** What each level adds; a level left out is not offered. */
  readonly levels: Readonly<
    Partial<Record<KeyScopeLevel, readonly AccessRef[]>>
  >;
  /**
   * Whether the group may be limited to some records of a business ("only selected Apps"). Only the plugin's own
   * guards can enforce this, through `KeyScope.objects(business)`; declare it only where they do.
   */
  readonly objects?: {
    /** The business whose records are picked, such as `rel.apps`. At most one group per business. */
    readonly business: string;
    readonly title: LocalizedText;
    /** Actions kept only while every record is in scope, such as creating one. */
    readonly allowsUnscoped?: readonly AccessRef[];
  };
}

export interface KeyScopePresetDeclaration {
  readonly id: string;
  readonly title: LocalizedText;
  readonly description?: LocalizedText;
  readonly groups: Readonly<
    Record<
      string,
      { readonly level: KeyScopeLevel; readonly objects?: 'all' | 'pick' }
    >
  >;
  /** The expiry the preset suggests, in days; null for none. */
  readonly expiresInDays?: number | null;
}

/** One group of a key's scope: the level, and the record ids it is limited to (omitted or `all` for every record). */
export interface KeyScopeGroupGrant {
  readonly level: KeyScopeLevel;
  readonly objects?: 'all' | readonly string[];
}

/** What a key's scope holds, group by group; a group left out grants nothing. */
export interface KeyScopeInput {
  readonly groups: Readonly<Record<string, KeyScopeGroupGrant>>;
}

/** The storage format's version, kept under `$v`. */
export const KEY_SCOPE_FORMAT_VERSION = '1';

/** The records a group grant is limited to; undefined when it reaches every record. */
export function pickedObjects(
  grant: KeyScopeGroupGrant,
): readonly string[] | undefined {
  return grant.objects === undefined || grant.objects === 'all'
    ? undefined
    : grant.objects;
}

/** The levels up to and including `level`. */
export function levelsUpTo(level: KeyScopeLevel): KeyScopeLevel[] {
  return KEY_SCOPE_LEVELS.slice(0, KEY_SCOPE_LEVELS.indexOf(level) + 1);
}

/**
 * A scope as Better Auth's `permissions` column holds it: each group's levels expanded (`"releases.apps":
 * ["read","write"]`), picked records under `"<group>@"`, and the format version under `$v`. Better Auth treats
 * `permissions` as server-only on create and update, so a key's holder cannot widen it through `/api-key/update`.
 */
export function encodeKeyScope(scope: KeyScopeInput): Record<string, string[]> {
  const encoded: Record<string, string[]> = {
    $v: [KEY_SCOPE_FORMAT_VERSION],
  };
  for (const [id, grant] of Object.entries(scope.groups)) {
    encoded[id] = levelsUpTo(grant.level);
    const picked = pickedObjects(grant);
    if (picked) encoded[`${id}@`] = [...picked];
  }
  return encoded;
}

/** The scope a `permissions` value holds; null for a key without one. A value in an unknown format grants nothing. */
export function decodeKeyScope(permissions: unknown): KeyScopeInput | null {
  const value: unknown =
    typeof permissions === 'string' ? safeParse(permissions) : permissions;
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return { groups: {} };
  const record = value as Record<string, unknown>;
  const version = record.$v;
  if (!Array.isArray(version) || version[0] !== KEY_SCOPE_FORMAT_VERSION)
    return { groups: {} };
  const groups: Record<string, KeyScopeGroupGrant> = {};
  for (const [id, levels] of Object.entries(record)) {
    if (id === '$v' || id.endsWith('@') || !Array.isArray(levels)) continue;
    const level = [...KEY_SCOPE_LEVELS]
      .reverse()
      .find((candidate) => levels.includes(candidate));
    if (!level) continue;
    const objects = record[`${id}@`];
    groups[id] = {
      level,
      ...(Array.isArray(objects)
        ? {
            objects: objects.filter(
              (item): item is string => typeof item === 'string',
            ),
          }
        : {}),
    };
  }
  return { groups };
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// What the server answers
// ---------------------------------------------------------------------------------------------------------------------

/** A group as an editor shows it, with what the asking user holds at each level today. */
export interface KeyScopeGroupView {
  readonly id: string;
  readonly category: KeyScopeCategory;
  readonly title: LocalizedText;
  readonly description: LocalizedText | null;
  /** The levels offered, lowest first. */
  readonly levels: readonly KeyScopeLevel[];
  /** What each level adds, for a hover list. */
  readonly access: Readonly<
    Partial<Record<KeyScopeLevel, readonly AccessRef[]>>
  >;
  /** Whether the user for whom the key is made holds everything up to each level; false shows it greyed out. */
  readonly held: Readonly<Partial<Record<KeyScopeLevel, boolean>>>;
  readonly objects: {
    readonly business: string;
    readonly title: LocalizedText;
  } | null;
}

export interface KeyScopePresetView {
  readonly id: string;
  readonly title: LocalizedText;
  readonly description: LocalizedText | null;
  readonly groups: KeyScopePresetDeclaration['groups'];
  readonly expiresInDays: number | null;
}

/** `GET /api/apiKeys/scopeOptions`: what the editor offers. Empty `groups` means scoped keys are not offered. */
export interface KeyScopeOptions {
  readonly groups: readonly KeyScopeGroupView[];
  readonly presets: readonly KeyScopePresetView[];
  /** The longest a scoped key may live, in days; null when "never expires" is allowed. */
  readonly maxScopedKeyDays: number | null;
  /** The expiry the editor proposes, in days. */
  readonly defaultExpiresInDays: number;
  /**
   * Whether the asking person may create keys of their own (`ScopedApiKeys.setOwnKeyPolicy`); sent by
   * `/api/apiKeys/scopeOptions`, absent elsewhere.
   */
  readonly mayCreate?: boolean;
}

/** A record a group may be limited to. */
export interface KeyScopeObject {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
}

/** A key as a list shows it: never its secret or hash. */
export interface ApiKeyView {
  readonly id: string;
  readonly name: string | null;
  readonly description: string | null;
  /** The first characters of the key, to recognize it. */
  readonly start: string | null;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  /** When the key was last used, as Better Auth records it. */
  readonly lastUsedAt: string | null;
  /** Null for a key that is its owner in full. */
  readonly scope: KeyScopeInput | null;
}

/** `POST` a key: a name, an optional description, an expiry in days (null for none) and a scope (null for full). */
export interface CreateApiKeyRequest {
  readonly name: string;
  readonly description?: string | null;
  readonly expiresInDays: number | null;
  readonly scope: KeyScopeInput | null;
}

/** A key just created or rotated: its secret, shown once. */
export interface CreatedApiKey {
  readonly key: ApiKeyView;
  readonly secret: string;
}
