/**
 * The key-scope registry: the permission groups and presets an application assembles from its plugins, how each
 * `AccessRef` maps to an authorization resource and action, and how a stored scope becomes the `KeyScope` the
 * authorization core enforces. Plugins never import this; the application hands their declarations to it.
 */
import type {
  AuthorizationIdentity,
  KeyScope,
  ResourceRef,
} from '@nocobase/authorization/core';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import {
  KEY_SCOPE_LEVELS,
  levelsUpTo,
  pickedObjects,
  type AccessRef,
  type KeyScopeGroupDeclaration,
  type KeyScopeGroupGrant,
  type KeyScopeInput,
  type KeyScopeLevel,
  type KeyScopeObject,
  type KeyScopePresetDeclaration,
} from '../shared/scopes.js';

/** Lists the records a group may be limited to: only those the identity may see in that business. */
export interface KeyScopeObjectSource {
  list(input: {
    readonly identity: AuthorizationIdentity;
    readonly search?: string;
    readonly ids?: readonly string[];
  }): Promise<readonly KeyScopeObject[]>;
}

/**
 * What an `AccessRef` is checked as: one action of a resource, or several where holding any of them is holding the ref
 * (a business action granted once per level, `edit.related` and `edit.all`); a scope covering the ref allows every one.
 * Null when the application does not offer it.
 */
export type AccessMapping = (
  ref: AccessRef,
) =>
  | { readonly resource: ResourceRef; readonly action: string }
  | { readonly resource: ResourceRef; readonly actions: readonly string[] }
  | null;

/** A mapped `AccessRef`: the actions of a resource it stands for, any one of which is holding it. */
export interface MappedAccess {
  readonly resource: ResourceRef;
  readonly actions: readonly string[];
}

/** A refused scope: 400 with a stable code. */
export class ApiKeyScopeError extends Error {
  constructor(
    readonly code:
      | 'INVALID_SCOPE'
      | 'EMPTY_SCOPE'
      | 'UNKNOWN_SCOPE_GROUP'
      | 'SCOPE_LEVEL_NOT_OFFERED'
      | 'SCOPE_OBJECTS_NOT_OFFERED'
      | 'UNKNOWN_SCOPE_OBJECT',
    message: string,
  ) {
    super(message);
    this.name = 'ApiKeyScopeError';
  }
}

export interface ApiKeyScopes {
  readonly groups: {
    /** Registers a group, with the source of its records when it offers object selection. Returns its removal. */
    add(
      group: KeyScopeGroupDeclaration,
      objects?: KeyScopeObjectSource,
    ): () => void;
    list(): readonly KeyScopeGroupDeclaration[];
    get(id: string): KeyScopeGroupDeclaration | undefined;
    /** The record source of a group that offers object selection. */
    objects(id: string): KeyScopeObjectSource | undefined;
  };
  readonly presets: {
    add(preset: KeyScopePresetDeclaration): () => void;
    list(): readonly KeyScopePresetDeclaration[];
  };
  /**
   * Sets how an `AccessRef` is checked. The default maps a page to `page:<id>/access` and a settings action to
   * `settings:<id>/<action>`, and offers no business action, whose resource type only the application knows.
   */
  mapAccess(mapping: AccessMapping): void;
  /** The resource actions a level of a group covers, mapped; refs the application does not offer are left out. */
  accessOf(
    group: KeyScopeGroupDeclaration,
    level: KeyScopeLevel,
    options?: { readonly allObjects?: boolean },
  ): MappedAccess[];
  /** Checks a scope against the registered groups; throws `ApiKeyScopeError`. Record ids are checked by the caller. */
  validate(input: unknown): KeyScopeInput;
  /** The `KeyScope` of a stored scope. Groups no longer registered grant nothing, so a removed group only narrows. */
  compile(keyId: string, scope: KeyScopeInput): KeyScope;
  /** The `KeyScope` of a key bounded only by its owner (a service account's unscoped key): it narrows nothing. */
  unbounded(keyId: string): KeyScope;
}

export const apiKeyScopesToken: ServiceToken<ApiKeyScopes> =
  createServiceToken<ApiKeyScopes>('@nocobase/app-plugin-api-keys/scopes');

const defaultMapping: AccessMapping = (ref) => {
  if (ref.kind === 'page')
    return { resource: { type: 'page', id: ref.id }, action: 'access' };
  if (ref.kind === 'settings')
    return { resource: { type: 'settings', id: ref.id }, action: ref.action };
  return null;
};

const refKey = (ref: AccessRef) =>
  ref.kind === 'page'
    ? `page:${ref.id}`
    : `${ref.kind}:${ref.id}/${ref.action}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createApiKeyScopes(): ApiKeyScopes {
  const groups = new Map<
    string,
    { group: KeyScopeGroupDeclaration; objects?: KeyScopeObjectSource }
  >();
  const presets = new Map<string, KeyScopePresetDeclaration>();
  let mapping: AccessMapping = defaultMapping;

  const offered = (group: KeyScopeGroupDeclaration) =>
    KEY_SCOPE_LEVELS.filter((level) => group.levels[level] !== undefined);

  const accessOf: ApiKeyScopes['accessOf'] = (group, level, options = {}) => {
    const unscopedOnly = new Set(
      (group.objects?.allowsUnscoped ?? []).map(refKey),
    );
    const result: MappedAccess[] = [];
    for (const step of levelsUpTo(level))
      for (const ref of group.levels[step] ?? []) {
        if (options.allObjects === false && unscopedOnly.has(refKey(ref)))
          continue;
        const mapped = mapping(ref);
        if (mapped)
          result.push({
            resource: mapped.resource,
            actions: 'actions' in mapped ? mapped.actions : [mapped.action],
          });
      }
    return result;
  };

  function validateGrant(id: string, value: unknown): KeyScopeGroupGrant {
    const group = groups.get(id)?.group;
    if (!group)
      throw new ApiKeyScopeError(
        'UNKNOWN_SCOPE_GROUP',
        `${id} is not a permission group.`,
      );
    if (!isRecord(value) || typeof value.level !== 'string')
      throw new ApiKeyScopeError(
        'INVALID_SCOPE',
        `${id} must be { level, objects? }.`,
      );
    const level = value.level as KeyScopeLevel;
    if (!offered(group).includes(level))
      throw new ApiKeyScopeError(
        'SCOPE_LEVEL_NOT_OFFERED',
        `${id} offers ${offered(group).join(', ')}, not ${String(value.level)}.`,
      );
    const objects = value.objects;
    if (objects === undefined || objects === 'all') return { level };
    if (!group.objects)
      throw new ApiKeyScopeError(
        'SCOPE_OBJECTS_NOT_OFFERED',
        `${id} cannot be limited to some records.`,
      );
    // An empty list reaches none of the records: the group's actions with nothing to act on, such as a key an
    // application recognizes by its identity for records it does not have yet.
    if (
      !Array.isArray(objects) ||
      objects.some((item) => typeof item !== 'string' || !item.trim())
    )
      throw new ApiKeyScopeError(
        'INVALID_SCOPE',
        `${id}.objects must be "all" or a list of ids.`,
      );
    return { level, objects: [...new Set(objects as string[])] };
  }

  function scopeOf(
    keyId: string,
    entries: Map<string, Set<string>>,
    objects: ReadonlyMap<string, readonly string[]>,
  ): KeyScope {
    const key = (resource: ResourceRef) =>
      JSON.stringify([resource.type, resource.id]);
    const resources = new Map<string, ResourceRef>();
    for (const [entry] of entries) {
      const [type, id] = JSON.parse(entry) as [string, string];
      resources.set(entry, { type, id });
    }
    return {
      keyId,
      allows: (resource, action) =>
        entries.get(key(resource))?.has(action) ?? false,
      objects: (business) => objects.get(business) ?? 'all',
      permissions: [...entries].map(([entry, actions]) => ({
        resource: resources.get(entry)!,
        actions: [...actions].sort(),
      })),
    };
  }

  return {
    groups: {
      add(group, objects) {
        if (groups.has(group.id))
          throw new Error(
            `Permission group ${group.id} is registered already.`,
          );
        if (group.objects) {
          const business = group.objects.business;
          for (const existing of groups.values())
            if (existing.group.objects?.business === business)
              throw new Error(
                `Permission groups ${existing.group.id} and ${group.id} both select records of ${business}.`,
              );
        }
        if (offered(group).length === 0)
          throw new Error(`Permission group ${group.id} offers no level.`);
        const entry = { group, ...(objects ? { objects } : {}) };
        groups.set(group.id, entry);
        return () => {
          if (groups.get(group.id) === entry) groups.delete(group.id);
        };
      },
      list: () => [...groups.values()].map((entry) => entry.group),
      get: (id) => groups.get(id)?.group,
      objects: (id) => groups.get(id)?.objects,
    },
    presets: {
      add(preset) {
        if (presets.has(preset.id))
          throw new Error(
            `Key scope preset ${preset.id} is registered already.`,
          );
        presets.set(preset.id, preset);
        return () => {
          if (presets.get(preset.id) === preset) presets.delete(preset.id);
        };
      },
      list: () => [...presets.values()],
    },
    mapAccess(next) {
      mapping = next;
    },
    accessOf,
    validate(input) {
      if (!isRecord(input) || !isRecord(input.groups))
        throw new ApiKeyScopeError(
          'INVALID_SCOPE',
          'A scope is { groups: { <group>: { level, objects? } } }.',
        );
      const result: Record<string, KeyScopeGroupGrant> = {};
      for (const [id, value] of Object.entries(input.groups))
        result[id] = validateGrant(id, value);
      if (Object.keys(result).length === 0)
        throw new ApiKeyScopeError(
          'EMPTY_SCOPE',
          'A scoped key needs at least one permission.',
        );
      return { groups: result };
    },
    compile(keyId, scope) {
      const entries = new Map<string, Set<string>>();
      const objects = new Map<string, readonly string[]>();
      for (const [id, grant] of Object.entries(scope.groups)) {
        const group = groups.get(id)?.group;
        if (!group || !offered(group).includes(grant.level)) continue;
        const picked = group.objects ? pickedObjects(grant) : undefined;
        if (picked && group.objects)
          objects.set(group.objects.business, picked);
        for (const { resource, actions: mapped } of accessOf(
          group,
          grant.level,
          { allObjects: picked === undefined },
        )) {
          const key = JSON.stringify([resource.type, resource.id]);
          const actions = entries.get(key) ?? new Set<string>();
          for (const action of mapped) actions.add(action);
          entries.set(key, actions);
        }
      }
      return scopeOf(keyId, entries, objects);
    },
    unbounded(keyId) {
      return {
        keyId,
        allows: () => true,
        objects: () => 'all',
        permissions: null,
      };
    },
  };
}
