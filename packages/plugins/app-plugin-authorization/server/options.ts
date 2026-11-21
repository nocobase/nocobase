import {
  dataScopeTarget,
  type AuthorizationTitle,
  type ResourceItemAction,
} from '@nocobase/authorization/core';
import { databaseHost } from './database/api.js';
import { PAGE_SECTION } from './pages-authorization.js';
import { databaseRecordAccessApplicable } from './database/record-access.js';
import type { AuthorizationExtensionHost } from './host.js';
import { optionText, type OptionText } from './i18n.js';

export interface AuthorizationOptionsAction {
  readonly name: string;
  readonly title: OptionText;
  readonly description?: OptionText;
  /** Composites only: page ids whose access a role editor turns this action on with. */
  readonly defaultFor?: readonly string[];
}

export interface AuthorizationOptionsDataScope {
  readonly key: string;
  readonly title: OptionText;
  readonly collection: string;
  readonly fields: readonly string[];
  /** Record access keys a grant or rule may choose here. */
  readonly recordAccess: readonly string[];
  readonly defaultValue?: string;
}

/** One grantable resource, listed on the right when its subsection is selected. */
export interface AuthorizationOptionsResource {
  readonly type: string;
  readonly id: string;
  readonly title: OptionText;
  readonly description?: OptionText;
  /** A name from `ui.groups`. */
  readonly group?: string;
  /** Composites only: page ids the actions are used on. */
  readonly usedOn?: readonly string[];
  readonly actions: readonly AuthorizationOptionsAction[];
  /** Composites only: the data scopes of each action. */
  readonly dataScopes?: Readonly<
    Record<string, readonly AuthorizationOptionsDataScope[]>
  >;
}

/** A left-side entry. */
export interface AuthorizationOptionsSubsection {
  readonly name: string;
  readonly title: OptionText;
  /**
   * Set when the client supplies the resources of a record type, such as
   * `page` from its route tree; the actions are the type's.
   */
  readonly recordType?: {
    readonly type: string;
    readonly actions: readonly AuthorizationOptionsAction[];
  };
  readonly resources: readonly AuthorizationOptionsResource[];
}

/** A left-side heading with its subsections, both in order. */
export interface AuthorizationOptionsSection {
  readonly name: string;
  readonly title: OptionText;
  readonly order: number;
  readonly subsections: readonly AuthorizationOptionsSubsection[];
}

/** A right-side heading; `parent` nests it. */
export interface AuthorizationOptionsResourceGroup {
  readonly name: string;
  readonly title: OptionText;
  readonly parent?: string;
  readonly order?: number;
}

export interface AuthorizationOptionsSubjectType {
  readonly type: string;
  readonly title: OptionText;
  readonly selection: { type: 'fixed'; id: string } | { type: 'collection' };
}

export interface AuthorizationOptionsRecordAccess {
  readonly key: string;
  readonly title: OptionText;
  readonly description?: OptionText;
  readonly collections: readonly string[];
}

/** What every `options` route answers. */
export interface AuthorizationOptions {
  readonly sections: readonly AuthorizationOptionsSection[];
  /** The resource groups the listed resources name, with their ancestors. */
  readonly resourceGroups?: readonly AuthorizationOptionsResourceGroup[];
  readonly subjectTypes: readonly AuthorizationOptionsSubjectType[];
  readonly recordAccess: readonly AuthorizationOptionsRecordAccess[];
  /** The registered collections, with the title they were registered with. */
  readonly collections: readonly {
    name: string;
    title: OptionText;
    fields: readonly string[];
  }[];
}

const title = (value: AuthorizationTitle | undefined, fallback: string) =>
  optionText(value, fallback);

function actionOption(action: ResourceItemAction): AuthorizationOptionsAction {
  return {
    name: action.name,
    title: title(action.title, action.name),
    ...(action.description === undefined
      ? {}
      : { description: title(action.description, '') }),
  };
}

/**
 * The workspace catalogue: sections, their subsections and each
 * subsection's resources, placed by `authz.ui`. `rules` narrows it to
 * composites with data scopes, which is all a rule plugin can target.
 */
export async function authorizationOptions(
  host: AuthorizationExtensionHost,
  options: { rules?: boolean } = {},
): Promise<AuthorizationOptions> {
  const database = databaseHost(host.database);
  const described = await Promise.all(
    host.database.collections.list().map(async (definition) => {
      const collection = await database?.describe(definition.name);
      return (
        collection && {
          name: definition.name,
          title: title(definition.title, definition.name),
          fields: collection.fields,
        }
      );
    }),
  );
  const collections = described.filter((item) => item !== undefined);
  const fields = new Map(collections.map((item) => [item.name, item.fields]));
  const placed = new Map<
    string,
    { order: number; resource: AuthorizationOptionsResource }[]
  >();
  for (const type of host.resourceTypes.list()) {
    const defaultSection = host.ui.defaultSectionOf(type.type);
    if (options.rules && type.type !== 'composite') continue;
    if (!type.items) continue;
    for (const item of type.items.list()) {
      // A placement production startup only warned about falls back to "Other".
      const found = host.ui.placementOf({ type: type.type, id: item.id });
      const placement =
        found && host.ui.sections.isSubsection(found.section)
          ? found
          : undefined;
      // Unplaced items of a type without a default section are not displayed.
      const section =
        placement?.section ??
        (defaultSection === undefined
          ? undefined
          : host.ui.sections.other(defaultSection));
      if (section === undefined) continue;
      const composite =
        type.type === 'composite'
          ? host.compositeResources
              .list()
              .find((entry) => entry.name === item.id)
          : undefined;
      const dataScopes =
        type.type === 'composite'
          ? compositeDataScopes(host, item.id, fields)
          : undefined;
      if (options.rules && !Object.keys(dataScopes ?? {}).length) continue;
      const group =
        placement?.group !== undefined && host.ui.groups.has(placement.group)
          ? placement.group
          : undefined;
      placed.set(section, [
        ...(placed.get(section) ?? []),
        {
          order: placement?.order ?? Number.POSITIVE_INFINITY,
          resource: {
            type: type.type,
            id: item.id,
            title: title(item.title, item.id),
            ...(item.description === undefined
              ? {}
              : { description: title(item.description, '') }),
            ...(group === undefined ? {} : { group }),
            ...(composite?.usedOn?.length
              ? { usedOn: [...composite.usedOn] }
              : {}),
            actions: item.actions.map((action) => {
              const defaultFor = composite?.actions.find(
                (entry) => entry.name === action.name,
              )?.defaultFor;
              return defaultFor?.length
                ? { ...actionOption(action), defaultFor: [...defaultFor] }
                : actionOption(action);
            }),
            ...(dataScopes && Object.keys(dataScopes).length
              ? { dataScopes }
              : {}),
          },
        },
      ]);
    }
  }
  // Array.prototype.sort is stable, so unordered resources keep registration order.
  const resources = new Map(
    [...placed].map(([section, entries]) => [
      section,
      [...entries]
        .sort((left, right) =>
          left.order === right.order ? 0 : left.order < right.order ? -1 : 1,
        )
        .map((entry) => entry.resource),
    ]),
  );
  const sections = host.ui.sections.tree().map((section) => ({
    name: section.name,
    title: title(section.title, section.name),
    order: section.order,
    subsections: section.subsections.flatMap(
      (subsection): AuthorizationOptionsSubsection[] => {
        const registered =
          subsection.name === PAGE_SECTION && host.resourceTypes.has('page')
            ? host.resourceTypes.get('page')
            : undefined;
        // The client fills the page subsection from its route tree.
        if (registered)
          return options.rules
            ? []
            : [
                {
                  name: subsection.name,
                  title: title(subsection.title, subsection.name),
                  recordType: {
                    type: registered.type,
                    actions: registered.actions.map(actionOption),
                  },
                  resources: [],
                },
              ];
        const listed = resources.get(subsection.name) ?? [];
        return listed.length
          ? [
              {
                name: subsection.name,
                title: title(subsection.title, subsection.name),
                resources: listed,
              },
            ]
          : [];
      },
    ),
  }));
  const resourceGroups = referencedGroups(host, [...resources.values()].flat());
  return {
    sections,
    ...(resourceGroups.length ? { resourceGroups } : {}),
    subjectTypes: host.subjects.list().flatMap((type) => {
      const administration = host.subjects.get(type)?.administration;
      if (!administration) return [];
      return [
        {
          type,
          title: optionText(administration.title, type),
          selection:
            administration.selection.type === 'fixed'
              ? { type: 'fixed' as const, id: administration.selection.id }
              : { type: 'collection' as const },
        },
      ];
    }),
    recordAccess: host.recordAccess.list().map((definition) => ({
      key: definition.key,
      title: title(definition.title, definition.key),
      ...(definition.description === undefined
        ? {}
        : { description: title(definition.description, '') }),
      collections: definition.collections,
    })),
    collections,
  };
}

/** The groups the resources name, with every ancestor, in registration order. */
function referencedGroups(
  host: AuthorizationExtensionHost,
  resources: readonly AuthorizationOptionsResource[],
): AuthorizationOptionsResourceGroup[] {
  const wanted = new Set<string>();
  for (const resource of resources) {
    let name = resource.group;
    while (name !== undefined && !wanted.has(name)) {
      wanted.add(name);
      name = host.ui.groups.get(name)?.parent;
    }
  }
  return host.ui.groups
    .list()
    .filter((group) => wanted.has(group.name))
    .map((group) => ({
      name: group.name,
      title: title(group.title, group.name),
      ...(group.parent === undefined ? {} : { parent: group.parent }),
      ...(group.order === undefined ? {} : { order: group.order }),
    }));
}

function compositeDataScopes(
  host: AuthorizationExtensionHost,
  id: string,
  fields: ReadonlyMap<string, readonly string[]>,
): Record<string, readonly AuthorizationOptionsDataScope[]> {
  const resource = host.compositeResources
    .list()
    .find((entry) => entry.name === id);
  const result: Record<string, readonly AuthorizationOptionsDataScope[]> = {};
  for (const action of resource?.actions ?? []) {
    const scopes = (action.dataScopes ?? []).map((scope) => {
      const collection = dataScopeTarget(action, scope.key).id;
      const collectionFields = fields.get(collection) ?? [];
      return {
        key: scope.key,
        title: title(scope.title, scope.key),
        collection,
        fields: collectionFields,
        recordAccess: host.recordAccess
          .listFor(collection)
          .filter((definition) =>
            databaseRecordAccessApplicable(definition, collectionFields),
          )
          .filter(
            (definition) =>
              !scope.options || scope.options.includes(definition.key),
          )
          .map((definition) => definition.key),
        ...(scope.defaultValue === undefined
          ? {}
          : { defaultValue: scope.defaultValue }),
      };
    });
    if (scopes.length) result[action.name] = scopes;
  }
  return result;
}

/**
 * The workspace catalogue limited to what a caller holds today (`snapshot`), for an editor of what a credential of
 * theirs, such as an API key, may do: only resources with an action they hold, with only those actions, and only the
 * collections those resources read. Who may be assigned anything is not theirs to see, so subject types are left out.
 */
export function grantableAuthorizationOptions(
  options: AuthorizationOptions,
  snapshot: {
    readonly unrestricted: boolean;
    readonly permissions: readonly {
      readonly resource: { readonly type: string; readonly id: string };
      readonly actions: readonly string[];
    }[];
  },
  /**
   * Actions listed as well whatever is held, which the server derives itself, such as those a key of the caller still
   * names after the caller lost them. Never taken from a request.
   */
  also: readonly {
    readonly resource: { readonly type: string; readonly id: string };
    readonly actions: readonly string[];
  }[] = [],
): AuthorizationOptions {
  if (snapshot.unrestricted) return { ...options, subjectTypes: [] };
  const extra = new Map<string, Set<string>>();
  for (const entry of also) {
    const key = JSON.stringify([entry.resource.type, entry.resource.id]);
    extra.set(key, new Set([...(extra.get(key) ?? []), ...entry.actions]));
  }
  const held = new Map(
    snapshot.permissions.map((permission) => [
      JSON.stringify([permission.resource.type, permission.resource.id]),
      new Set(permission.actions),
    ]),
  );
  const read = new Set<string>();
  const sections = options.sections.flatMap((section) => {
    const subsections = section.subsections.flatMap((subsection) => {
      if (subsection.recordType) return [subsection];
      const resources = subsection.resources.flatMap((resource) => {
        const key = JSON.stringify([resource.type, resource.id]);
        const actions = held.get(key);
        const named = extra.get(key);
        const kept = resource.actions.filter(
          (action) => actions?.has(action.name) || named?.has(action.name),
        );
        if (!kept.length) return [];
        const dataScopes = resource.dataScopes
          ? Object.fromEntries(
              Object.entries(resource.dataScopes).filter(([action]) =>
                kept.some((entry) => entry.name === action),
              ),
            )
          : undefined;
        for (const scopes of Object.values(dataScopes ?? {}))
          for (const scope of scopes) read.add(scope.collection);
        return [
          {
            ...resource,
            actions: kept,
            ...(dataScopes ? { dataScopes } : {}),
          },
        ];
      });
      return resources.length ? [{ ...subsection, resources }] : [];
    });
    return subsections.length ? [{ ...section, subsections }] : [];
  });
  return {
    ...options,
    sections,
    subjectTypes: [],
    collections: options.collections.filter((collection) =>
      read.has(collection.name),
    ),
  };
}
