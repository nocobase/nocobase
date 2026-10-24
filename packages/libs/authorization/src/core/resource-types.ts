import type { AccessConstraintService } from './constraints.js';
import type {
  AuthorizationGrant,
  AuthorizationGrantService,
} from './grants.js';
import type { AuthorizationTitle } from './titles.js';
import type {
  AuthorizationDecision,
  AuthorizationReason,
  AuthorizationRequest,
} from './types.js';

export interface ResourceItemAction {
  readonly name: string;
  readonly title?: AuthorizationTitle;
  readonly description?: AuthorizationTitle;
}

/** One thing of a resource type that can be granted. */
export interface ResourceItem {
  readonly id: string;
  readonly title: AuthorizationTitle;
  readonly description?: AuthorizationTitle;
  readonly actions: readonly ResourceItemAction[];
}

export interface ResourceItemDefinition {
  readonly id: string;
  readonly title: AuthorizationTitle;
  readonly description?: AuthorizationTitle;
  /** Omit to inherit every action the resource type declares. */
  readonly actions?: readonly (string | ResourceItemAction)[];
}

interface ItemBinding {
  readonly type: string;
  readonly actions?: readonly ResourceItemAction[];
}

const itemBindings = new WeakMap<ResourceItems, ItemBinding>();
const itemEntries = new WeakMap<
  ResourceItems,
  Map<string, ResourceItemDefinition>
>();

/** The items of one catalog resource type. */
export class ResourceItems {
  private readonly entries = new Map<string, ResourceItemDefinition>();

  constructor() {
    itemEntries.set(this, this.entries);
  }

  add(definition: ResourceItemDefinition): void {
    const item = normalizeItem(definition);
    if (this.entries.has(item.id))
      throw new Error(`Resource item already registered: ${item.id}`);
    const binding = itemBindings.get(this);
    if (binding) validateItem(item, binding);
    this.entries.set(item.id, item);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  get(id: string): ResourceItem | undefined {
    const item = this.entries.get(id);
    return item && resolveItem(item, itemBindings.get(this));
  }

  list(): readonly ResourceItem[] {
    const binding = itemBindings.get(this);
    return [...this.entries.values()].map((item) => resolveItem(item, binding));
  }
}

function normalizeItem(
  definition: ResourceItemDefinition,
): ResourceItemDefinition {
  if (!definition.id) throw new TypeError('A resource item needs an id');
  const actions = definition.actions?.map((action): ResourceItemAction =>
    typeof action === 'string' ? { name: action } : action,
  );
  if (actions) {
    const names = actions.map((action) => action.name);
    if (
      !names.length ||
      names.some((name) => !name) ||
      new Set(names).size !== names.length
    )
      throw new TypeError(
        `Resource item ${definition.id} needs unique, nonempty actions`,
      );
  }
  return structuredClone({
    ...definition,
    ...(actions ? { actions } : {}),
  });
}

function validateItem(
  item: ResourceItemDefinition,
  binding: ItemBinding,
): void {
  if (!item.actions && !binding.actions)
    throw new TypeError(
      `Resource item ${binding.type}:${item.id} needs actions: its type declares none`,
    );
  const declared = binding.actions;
  for (const action of item.actions ?? []) {
    const name = typeof action === 'string' ? action : action.name;
    if (declared && !declared.some((entry) => entry.name === name))
      throw new TypeError(
        `Resource type ${binding.type} does not declare action ${name}`,
      );
  }
}

function resolveItem(
  item: ResourceItemDefinition,
  binding: ItemBinding | undefined,
): ResourceItem {
  const declared = binding?.actions ?? [];
  const actions = (item.actions ?? declared).map(
    (action): ResourceItemAction => {
      const value = typeof action === 'string' ? { name: action } : action;
      const title =
        value.title ??
        declared.find((entry) => entry.name === value.name)?.title;
      return { ...value, ...(title === undefined ? {} : { title }) };
    },
  );
  return structuredClone({ ...item, actions });
}

export interface AuthorizationRuntimeContext {
  readonly grants: AuthorizationGrantService;
  readonly constraints: AccessConstraintService;
}

export type ResourceAuthorize<TParams = undefined> = (
  request: AuthorizationRequest<TParams>,
  context: AuthorizationRuntimeContext,
) => Promise<AuthorizationDecision>;

export type ResourceAuthorizeUnrestricted<TParams = undefined> = (
  request: AuthorizationRequest<TParams>,
) => Promise<AuthorizationDecision>;

/** An action every item of the type may declare, with its own judgement. */
export interface ResourceTypeAction<TParams = undefined> {
  readonly name: string;
  readonly title?: AuthorizationTitle;
  readonly authorize?: ResourceAuthorize<TParams>;
  readonly authorizeUnrestricted?: ResourceAuthorizeUnrestricted<TParams>;
}

/** A resource type exists only for judgement and is never displayed. */
export interface ResourceTypeDefinition<TParams = undefined> {
  /** Any name except `composite`, which the core reserves for composites. */
  readonly type: string;
  /** A record type must declare its actions; a catalog type's items inherit them. */
  readonly actions?: readonly (string | ResourceTypeAction<TParams>)[];
  /**
   * Whether a grant on this type can be narrowed to records, which is what a
   * composite's data scope needs of its target. Defaults to false.
   */
  readonly recordAccess?: boolean;
  /** Makes this a catalog type: only registered items and their actions pass. */
  readonly items?: ResourceItems;
  /** Defaults to `grantBacked()`. */
  readonly authorize?: ResourceAuthorize<TParams>;
  /** Defaults to permitting. Unsupported items and actions stay denied either way. */
  readonly authorizeUnrestricted?: ResourceAuthorizeUnrestricted<TParams>;
}

export interface RegisteredResourceType {
  readonly type: string;
  /** The declared type-level actions. */
  readonly actions: readonly ResourceItemAction[];
  /** Whether a composite's data scope may target this type. */
  readonly recordAccess: boolean;
  /** Present on a catalog type; a record type has none. */
  readonly items?: ResourceItems;
}

export interface GrantBackedOptions<TParams = undefined> {
  /** A further condition checked once a matching grant exists. */
  also?(
    request: AuthorizationRequest<TParams>,
    grants: readonly AuthorizationGrant[],
  ): Promise<boolean>;
}

/** Permits when a policy-less grant matches the request. */
export function grantBacked<TParams = undefined>(
  options: GrantBackedOptions<TParams> = {},
): ResourceAuthorize<TParams> {
  return async (request, context) => {
    const grants = (
      await context.grants.resolve({
        principal: request.principal,
        ...(request.subjects === undefined
          ? {}
          : { subjects: request.subjects }),
        resource: request.resource,
        action: request.action,
      })
    ).filter((grant) => grant.policy === undefined);
    if (
      !grants.length ||
      (options.also && !(await options.also(request, grants)))
    )
      return {
        effect: 'deny',
        reasons: [
          {
            code: 'NO_MATCHING_GRANT',
            message: `No grant allows ${request.resource.type}:${request.resource.id}.${request.action}`,
          },
        ],
      };
    return {
      effect: 'permit',
      reasons: grants.map((grant): AuthorizationReason => ({
        code: 'GRANT_MATCHED',
        message: `${grant.source.plugin}:${grant.source.id} allows ${request.resource.type}:${request.resource.id}.${request.action}`,
        details: { source: grant.source },
      })),
    };
  };
}

/** The private judgement of one resource type. */
export interface ResourceTypeHandler {
  readonly type: string;
  authorize(
    request: AuthorizationRequest<unknown>,
    context: AuthorizationRuntimeContext,
  ): Promise<AuthorizationDecision>;
  authorizeUnrestricted(
    request: AuthorizationRequest<unknown>,
  ): Promise<AuthorizationDecision>;
}

const handlers = new WeakMap<
  ResourceTypeRegistry,
  Map<string, ResourceTypeHandler>
>();

/** Package-internal: the Authorization reads handlers, nobody else does. */
export function resourceTypeHandler(
  registry: ResourceTypeRegistry,
  type: string,
): ResourceTypeHandler | undefined {
  return handlers.get(registry)?.get(type);
}

const RESERVED_TYPE = 'composite';
let addingReserved = false;

/** Package-internal: registers the reserved `composite` type for `authz.compositeResources`. */
export function addReservedResourceType<TParams>(
  registry: ResourceTypeRegistry,
  definition: ResourceTypeDefinition<TParams>,
): RegisteredResourceType {
  addingReserved = true;
  try {
    return registry.add(definition);
  } finally {
    addingReserved = false;
  }
}

export const RESOURCE_ACTION_NOT_SUPPORTED = 'RESOURCE_ACTION_NOT_SUPPORTED';
export const UNRESTRICTED_ACCESS = 'UNRESTRICTED_ACCESS';

/**
 * Every resource type. A catalog type has items and validates the item and
 * action; a record type has none, validates only the action and leaves the
 * record id to its own judgement.
 */
export class ResourceTypeRegistry {
  private readonly registered = new Map<string, RegisteredResourceType>();

  constructor() {
    handlers.set(this, new Map());
  }

  add<TParams = undefined>(
    definition: ResourceTypeDefinition<TParams>,
  ): RegisteredResourceType {
    const type = definition.type;
    if (!type) throw new TypeError('A resource type needs a name');
    if (type === RESERVED_TYPE && !addingReserved)
      throw new Error(
        `Resource type ${RESERVED_TYPE} is reserved for composite resources; use authz.compositeResources.define`,
      );
    if (this.registered.has(type))
      throw new Error(`Resource type already registered: ${type}`);
    const actions = definition.actions?.map(
      (action): ResourceTypeAction<TParams> =>
        typeof action === 'string' ? { name: action } : action,
    );
    const names = actions?.map((action) => action.name) ?? [];
    if (names.some((name) => !name) || new Set(names).size !== names.length)
      throw new TypeError(
        `Resource type ${type} needs unique, nonempty actions`,
      );
    const items = definition.items;
    if (!items && !actions?.length)
      throw new TypeError(
        `Resource type ${type} needs items or declared actions`,
      );
    const declared = actions?.map(({ name, title }): ResourceItemAction =>
      title === undefined ? { name } : { name, title },
    );
    if (items) {
      if (itemBindings.has(items))
        throw new Error(`Resource items already belong to a type: ${type}`);
      const binding: ItemBinding = {
        type,
        ...(declared ? { actions: declared } : {}),
      };
      for (const item of itemEntries.get(items)?.values() ?? [])
        validateItem(item, binding);
      itemBindings.set(items, binding);
    }
    const typeAuthorize: ResourceAuthorize<TParams> =
      definition.authorize ?? grantBacked<TParams>();
    const unsupported = (
      request: AuthorizationRequest<unknown>,
    ): AuthorizationDecision | undefined => {
      const action = request.action;
      if (
        items
          ? items
              .get(request.resource.id)
              ?.actions.some((entry) => entry.name === action)
          : names.includes(action)
      )
        return undefined;
      return {
        effect: 'deny',
        reasons: [
          {
            code: RESOURCE_ACTION_NOT_SUPPORTED,
            message: `${type}:${request.resource.id} does not expose action ${action}`,
          },
        ],
      };
    };
    const actionOf = (
      request: AuthorizationRequest<unknown>,
    ): ResourceTypeAction<TParams> | undefined =>
      actions?.find((action) => action.name === request.action);
    const typed = (
      request: AuthorizationRequest<unknown>,
    ): AuthorizationRequest<TParams> =>
      request as unknown as AuthorizationRequest<TParams>;
    handlers.get(this)!.set(type, {
      type,
      authorize: async (request, context) =>
        unsupported(request) ??
        (actionOf(request)?.authorize ?? typeAuthorize)(
          typed(request),
          context,
        ),
      authorizeUnrestricted: async (request) => {
        const denied = unsupported(request);
        if (denied) return denied;
        const authorize =
          actionOf(request)?.authorizeUnrestricted ??
          definition.authorizeUnrestricted;
        return authorize
          ? authorize(typed(request))
          : {
              effect: 'permit',
              reasons: [
                {
                  code: UNRESTRICTED_ACCESS,
                  message: `Unrestricted access allows ${type}.${request.action}`,
                },
              ],
            };
      },
    });
    const registered: RegisteredResourceType = {
      type,
      actions: structuredClone(declared ?? []),
      recordAccess: definition.recordAccess === true,
      ...(items ? { items } : {}),
    };
    this.registered.set(type, registered);
    return registered;
  }

  has(type: string): boolean {
    return this.registered.has(type);
  }

  /** Throws for a type nobody registered. */
  get(type: string): RegisteredResourceType {
    const registered = this.registered.get(type);
    if (!registered)
      throw new Error(`Resource type is not registered: ${type}`);
    return registered;
  }

  list(): readonly RegisteredResourceType[] {
    return [...this.registered.values()].sort((left, right) =>
      left.type.localeCompare(right.type),
    );
  }
}
