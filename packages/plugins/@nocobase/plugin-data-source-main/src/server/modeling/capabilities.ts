/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { PlainObject, PLUGIN_REQUIREMENTS, TEMPLATE_NAMES, TemplateName } from './constants';
import { normalizeInterfaceName } from './fields';

export function getPluginRequirement(interfaceOrTemplate?: string) {
  return interfaceOrTemplate ? PLUGIN_REQUIREMENTS[interfaceOrTemplate] : undefined;
}

export async function assertModelingSupport(
  app: any,
  input: {
    template?: TemplateName;
    fields?: PlainObject[];
    viewName?: string;
    schema?: string;
    inherits?: string | string[];
  },
) {
  const required = _.uniqBy(
    [
      input.template ? getPluginRequirement(input.template) : undefined,
      ...(input.fields || []).map((field) => getPluginRequirement(normalizeInterfaceName(field.interface))),
    ].filter(Boolean),
    'runtimeName',
  ) as Array<{ runtimeName: string; packageName: string; capability: string }>;

  for (const requirement of required) {
    const plugin = app.pm.get(requirement.runtimeName);
    if (!plugin?.enabled) {
      throw new Error(
        `${requirement.capability} requires plugin ${requirement.packageName} (runtime name: ${requirement.runtimeName}) to be enabled`,
      );
    }
  }

  if ((input.template === 'view' || input.viewName) && input.viewName) {
    const views = await app.db.queryInterface.listViews({
      schema:
        input.schema ||
        process.env.COLLECTION_MANAGER_SCHEMA ||
        app.db.options?.schema ||
        process.env.DB_SCHEMA ||
        'public',
    });

    if (!views.find((view: any) => view.name === input.viewName)) {
      throw new Error(`view collection requires upstream database view ${input.viewName} to exist first`);
    }
  }

  if (input.template === 'inherit' && input.inherits) {
    for (const parent of _.castArray(input.inherits)) {
      if (!app.db.hasCollection(parent)) {
        throw new Error(`inherit collection requires parent collection ${parent} to exist first`);
      }
    }
  }
}

export function inspectModeling(app: any, collectionName?: string) {
  const pluginStates = [...app.pm.getPlugins().values()].map((plugin: any) => ({
    name: plugin.name,
    packageName: plugin.options?.packageName,
    enabled: plugin.enabled,
  }));

  if (!collectionName) {
    return {
      templates: TEMPLATE_NAMES,
      pluginStates,
      collections: [...app.db.collections.values()]
        .filter((collection: any) => collection.options?.loadedFromCollectionManager)
        .map((collection: any) => ({
          name: collection.name,
          title: collection.options?.title,
          template: collection.options?.template,
        })),
    };
  }

  const collection = app.db.getCollection(collectionName);
  if (!collection) {
    throw new Error(`collection ${collectionName} not found`);
  }

  return {
    name: collection.name,
    options: collection.options,
    fields: [...collection.fields.values()].map((field: any) => field.options),
    pluginStates,
  };
}

export function verifyCollectionDefinition(app: any, collectionName: string) {
  const collection = app.db.getCollection(collectionName);
  if (!collection) {
    throw new Error(`collection ${collectionName} not found`);
  }

  const issues: string[] = [];
  const fields = [...collection.fields.values()].map((field: any) => field.options);
  const fieldNames = new Set(fields.map((field) => field.name));
  const relationBackingFieldNames = new Set(
    fields.flatMap((field) => [field.foreignKey, field.otherKey].filter(Boolean) as string[]),
  );
  const shouldSkipPresentationChecks = (field: PlainObject) =>
    field.isForeignKey === true ||
    relationBackingFieldNames.has(field.name) ||
    ['exclude', 'meta', 'sort'].includes(field.name);

  if (!collection.options?.template) {
    issues.push('Collection template is missing.');
  }

  if (!fieldNames.has('id') && collection.options?.template !== 'calendar' && collection.options?.template !== 'view') {
    issues.push('Primary key field `id` is missing.');
  }

  for (const field of fields) {
    if (!field.interface && !shouldSkipPresentationChecks(field)) {
      issues.push(`Field ${field.name} is missing interface.`);
    }
    if (!field.type) {
      issues.push(`Field ${field.name} is missing type.`);
    }
    if (!field.uiSchema?.title && !shouldSkipPresentationChecks(field)) {
      issues.push(`Field ${field.name} is missing uiSchema.title.`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    data: {
      name: collection.name,
      template: collection.options?.template,
      fields: fields.map((field) => ({
        name: field.name,
        interface: field.interface,
        type: field.type,
        title: field.uiSchema?.title,
      })),
    },
  };
}
