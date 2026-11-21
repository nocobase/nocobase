/**
 * Key scopes as data: what a key's permissions hold and how they are stored in Better Auth's `permissions` column.
 * Nothing here imports another plugin.
 *
 * A key's permissions take the shape of a permission set's grants (`KeyPermissions`, stored as format `2`): the same
 * resources and actions, with the record scopes of a composite action as its policy, and the records a business is
 * limited to. Format `1` — permission groups at a read, write or admin level (`KeyScopeInput`), declared by each plugin
 * (`KeyScopeGroupDeclaration`) — is deprecated: it is still accepted and read, and converted to format `2`.
 *
 * Permissions only ever narrow: a key's effective permission is its holder's current permission intersected with
 * them. A key without any (`permissions = null`) is its holder, exactly as before scopes existed.
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

/** @deprecated Format `1`; see the file's description. */
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

/** @deprecated Format `1`; see the file's description. */
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
 * @deprecated Format `1`; new keys are stored as `encodeKeyPermissions` writes them.
 *
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

/**
 * The format-`1` scope a `permissions` value holds; null for a key without one. A format-`2` value answers the groups
 * it was converted from, or none. A value in an unknown format grants nothing.
 *
 * @deprecated Read `decodeKeyPermissions`.
 */
export function decodeKeyScope(permissions: unknown): KeyScopeInput | null {
  const value: unknown =
    typeof permissions === 'string' ? safeParse(permissions) : permissions;
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return { groups: {} };
  const record = value as Record<string, unknown>;
  const version = record.$v;
  if (version === KEY_PERMISSIONS_FORMAT_VERSION)
    return legacyOf(record.legacy) ?? { groups: {} };
  if (!Array.isArray(version) || version[0] !== KEY_SCOPE_FORMAT_VERSION)
    return { groups: {} };
  const groups: Record<string, KeyScopeGroupGrant> = {};
  for (const [id, levels] of Object.entries(record)) {
    if (id === '$v' || id.endsWith('@') || !Array.isArray(levels)) continue;
    const level = [...KEY_SCOPE_LEVELS]
      .reverse()
      .find((candidate) => levels.includes(candidate));
    if (!level) continue;
    groups[id] = { level, ...storedObjects(record[`${id}@`]) };
  }
  return { groups };
}

/**
 * The records a stored format-`1` group is limited to: none set when left out, and none reached when present but not
 * a list, so a damaged limit never reads as every record.
 */
function storedObjects(value: unknown): { objects?: string[] } {
  if (value === undefined) return {};
  if (!Array.isArray(value)) return { objects: [] };
  return {
    objects: (value as unknown[]).filter(
      (item): item is string => typeof item === 'string',
    ),
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// Format 2: the shape of a permission set's grants
// ---------------------------------------------------------------------------------------------------------------------

/** The storage format of `KeyPermissions`, kept under `$v`. */
export const KEY_PERMISSIONS_FORMAT_VERSION = '2';

/** An authorization resource, as `@nocobase/authorization/core` names it. */
export interface KeyResourceRef {
  readonly type: string;
  readonly id: string;
}

/** A data policy, such as the record scopes of a composite action: `{ type: 'composite', scopes: { … } }`. */
export interface KeyPermissionPolicy {
  readonly type: string;
  readonly [key: string]: unknown;
}

/** One resource of a key's permissions, as a permission set's grant holds it. */
export interface KeyPermissionGrant {
  readonly resource: KeyResourceRef;
  readonly actions: readonly {
    readonly action: string;
    readonly policy?: KeyPermissionPolicy;
  }[];
}

/** What a key may do: its grants, and the records each business is limited to (every record when left out). */
export interface KeyPermissions {
  readonly grants: readonly KeyPermissionGrant[];
  readonly objects?: Readonly<Record<string, readonly string[]>>;
}

/** What a `permissions` column holds, read back. */
export type DecodedKeyPermissions =
  /** A key without permissions: its holder in full. */
  | null
  /** Format `1`, not converted yet. */
  | { readonly version: '1'; readonly scope: KeyScopeInput }
  /**
   * Format `2`, with the format-`1` groups it was converted from, which the deprecated views still show. A value in
   * an unknown or damaged format reads as format `2` with no grant, so it grants nothing.
   */
  | {
      readonly version: '2';
      readonly permissions: KeyPermissions;
      readonly legacy: KeyScopeInput | null;
    };

/** The JSON a `permissions` column stores for `permissions`, with the format-`1` groups they were converted from. */
export function encodeKeyPermissions(
  permissions: KeyPermissions,
  legacy?: KeyScopeInput | null,
): string {
  return JSON.stringify({
    $v: KEY_PERMISSIONS_FORMAT_VERSION,
    grants: permissions.grants,
    ...(permissions.objects && Object.keys(permissions.objects).length > 0
      ? { objects: permissions.objects }
      : {}),
    ...(legacy ? { legacy } : {}),
  });
}

const NOTHING: DecodedKeyPermissions = {
  version: '2',
  permissions: { grants: [] },
  legacy: null,
};

/** Reads a `permissions` column in either format. */
export function decodeKeyPermissions(
  permissions: unknown,
): DecodedKeyPermissions {
  const value: unknown =
    typeof permissions === 'string' ? safeParse(permissions) : permissions;
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object' || Array.isArray(value)) return NOTHING;
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.$v) && record.$v[0] === KEY_SCOPE_FORMAT_VERSION)
    return { version: '1', scope: decodeKeyScope(record) ?? { groups: {} } };
  if (record.$v !== KEY_PERMISSIONS_FORMAT_VERSION) return NOTHING;
  // A field left out means none; a field present but damaged is never read as left out, because a missing policy or
  // record limit reaches more than a damaged one meant to. Damage to `grants` or `objects` as a whole grants nothing.
  if (record.grants !== undefined && !Array.isArray(record.grants))
    return NOTHING;
  if (record.objects !== undefined && !isObject(record.objects)) return NOTHING;
  const objects = objectsOf(record.objects);
  return {
    version: '2',
    permissions: {
      grants: grantsOf(record.grants),
      ...(objects ? { objects } : {}),
    },
    legacy: legacyOf(record.legacy),
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The well-formed grants of a stored value. A damaged grant or action is left out — an action whose policy is present
 * but damaged too, rather than kept without its record scopes — so damage only narrows.
 */
function grantsOf(value: unknown): KeyPermissionGrant[] {
  if (!Array.isArray(value)) return [];
  const grants: KeyPermissionGrant[] = [];
  for (const entry of value as unknown[]) {
    if (!isObject(entry) || !isObject(entry.resource)) continue;
    const { type, id } = entry.resource;
    if (typeof type !== 'string' || typeof id !== 'string') continue;
    const actions = Array.isArray(entry.actions)
      ? (entry.actions as unknown[]).flatMap((action) => {
          if (!isObject(action) || typeof action.action !== 'string') return [];
          if (action.policy === undefined) return [{ action: action.action }];
          return wellFormedPolicy(type, action.policy)
            ? [
                {
                  action: action.action,
                  policy: action.policy as KeyPermissionPolicy,
                },
              ]
            : [];
        })
      : [];
    if (actions.length > 0) grants.push({ resource: { type, id }, actions });
  }
  return grants;
}

/**
 * Whether a stored policy can still be read: only a composite action takes one, as `{ type: 'composite', scopes }`
 * with its record scopes an object. Anything else would let the action reach the holder's own records.
 */
function wellFormedPolicy(resourceType: string, policy: unknown): boolean {
  return (
    resourceType === 'composite' &&
    isObject(policy) &&
    policy.type === 'composite' &&
    isObject(policy.scopes)
  );
}

/** Each business's records; a damaged list reaches none of them, and a damaged id is left out. */
function objectsOf(
  value: unknown,
): Readonly<Record<string, readonly string[]>> | undefined {
  if (!isObject(value)) return undefined;
  const objects: Record<string, string[]> = {};
  for (const [business, ids] of Object.entries(value))
    objects[business] = Array.isArray(ids)
      ? (ids as unknown[]).filter(
          (id): id is string => typeof id === 'string' && id !== '',
        )
      : [];
  return Object.keys(objects).length > 0 ? objects : undefined;
}

function legacyOf(value: unknown): KeyScopeInput | null {
  if (!isObject(value) || !isObject(value.groups)) return null;
  const groups: Record<string, KeyScopeGroupGrant> = {};
  for (const [id, grant] of Object.entries(value.groups)) {
    if (
      !isObject(grant) ||
      !KEY_SCOPE_LEVELS.includes(grant.level as KeyScopeLevel)
    )
      continue;
    groups[id] = {
      level: grant.level as KeyScopeLevel,
      ...storedObjects(grant.objects),
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
/** @deprecated Format `1`; see the file's description. */
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
  /**
   * The format-`1` groups of the key: those it was made or converted from, none for a key made with `permissions`;
   * null for a key that is its owner in full.
   *
   * @deprecated Read `permissions`.
   */
  readonly scope: KeyScopeInput | null;
  /**
   * What the key may do; null for a key that is its owner in full. Every key the server answers has it; optional so a
   * caller that builds views of its own in the format-`1` shape keeps compiling.
   */
  readonly permissions?: KeyPermissions | null;
}

/**
 * `POST` a key: a name, an optional description, an expiry in days (null for none) and what it may do — `permissions`,
 * or the deprecated format-`1` `scope` — null for the caller in full. Exactly one of the two is given.
 */
export interface CreateApiKeyRequest {
  readonly name: string;
  readonly description?: string | null;
  readonly expiresInDays: number | null;
  /** @deprecated Send `permissions`. */
  readonly scope?: KeyScopeInput | null;
  readonly permissions?: KeyPermissions | null;
}

/** An action as the permission editor offers it for a key. */
export interface GrantableAction {
  readonly action: string;
  readonly title: LocalizedText | null;
  /** Why no key may hold it; present means the editor shows it greyed out, "people only". */
  readonly humanOnly: LocalizedText | null;
  readonly risk: 'high' | 'sensitive' | null;
  /**
   * For a composite action, the record scopes the caller holds of each data scope, by its key: the record access keys
   * (such as `allRecords`, `recordsIOwn`) any of their roles gives it. A key may be given these or narrower ones, never
   * a wider one. Absent when every scope is open to the caller, as for an unrestricted one.
   */
  readonly scopes?: Readonly<Record<string, readonly string[]>>;
}

/** A resource the caller holds actions of, and so may give a key. */
export interface GrantableResource {
  readonly resource: KeyResourceRef;
  readonly title: LocalizedText | null;
  readonly actions: readonly GrantableAction[];
}

/** A template, resolved to what the caller holds: the permissions it starts a key with. */
export interface KeyTemplateView {
  readonly id: string;
  readonly title: LocalizedText;
  readonly description: LocalizedText | null;
  readonly expiresInDays: number | null;
  readonly permissions: KeyPermissions;
  /** The businesses whose records the template limits the key to, chosen when the key is made. */
  readonly pick: readonly string[];
}

/** `GET /api/apiKeys/grantable`: what the caller may give a key of their own. */
export interface GrantablePermissions {
  /** True when the caller holds every action; `grants` then lists the whole catalog. */
  readonly unrestricted: boolean;
  readonly grants: readonly GrantableResource[];
  readonly templates: readonly KeyTemplateView[];
  /** The businesses a key may be limited to some records of. */
  readonly objectSources: readonly string[];
  readonly maxScopedKeyDays: number | null;
  readonly defaultExpiresInDays: number;
  readonly mayCreate: boolean;
  /** Whether a key that is the caller in full ("same as me") may be created. */
  readonly allowSameAsMe: boolean;
}

/** `GET /api/apiKeys/:keyId`: a key with the actions it lost with its owner, which come back when the owner holds them. */
export interface ApiKeyDetailView extends ApiKeyView {
  readonly lapsed: readonly KeyPermissionGrant[];
}

/** A key just created or rotated: its secret, shown once. */
export interface CreatedApiKey {
  readonly key: ApiKeyView;
  readonly secret: string;
}
