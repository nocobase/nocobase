/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { Utils } from 'sequelize';

const RELATION_INTERFACE_TYPE_MAP = {
  m2o: 'belongsTo',
  obo: 'belongsTo',
  o2m: 'hasMany',
  oho: 'hasOne',
  m2m: 'belongsToMany',
};

const RELATION_TYPES = new Set(['belongsTo', 'hasMany', 'hasOne', 'belongsToMany']);

export function parseCollectionNameWithDataSourceKey(value?: string) {
  if (!value) {
    return {};
  }

  const separatorIndex = value.indexOf('.');
  if (separatorIndex === -1) {
    return {};
  }

  return {
    dataSourceKey: value.slice(0, separatorIndex),
    collectionName: value.slice(separatorIndex + 1),
  };
}

function mergeSettings(input = {}) {
  const { settings, ...rest } = input as any;
  return {
    ...(settings || {}),
    ...rest,
  };
}

function buildRelationKeyName(name?: string, key = 'id') {
  return Utils.camelize([Utils.singularize(name || ''), key].join('_'));
}

function buildThroughName(source?: string, target?: string) {
  return Utils.camelize(
    [source, target]
      .filter(Boolean)
      .map((name) => String(name).toLowerCase())
      .sort()
      .join('_'),
  );
}

export function normalizeExternalFieldInput(
  rawValues: any,
  defaults: {
    dataSourceKey?: string;
    collectionName?: string;
  },
) {
  const values = mergeSettings(rawValues) as any;
  const dataSourceKey = values.dataSourceKey || defaults.dataSourceKey;
  const collectionName = values.collectionName || defaults.collectionName;

  if (!dataSourceKey) {
    throw new Error('dataSourcesCollections.fields:apply requires dataSourceKey');
  }
  if (!collectionName) {
    throw new Error('dataSourcesCollections.fields:apply requires collectionName');
  }
  if (!values.name) {
    throw new Error('dataSourcesCollections.fields:apply requires name');
  }

  const interfaceType = values.interface;
  const type = values.type || RELATION_INTERFACE_TYPE_MAP[interfaceType];
  const normalized = {
    ...values,
    dataSourceKey,
    collectionName,
    type,
  };

  if (RELATION_TYPES.has(normalized.type)) {
    if (!normalized.target) {
      throw new Error(`Relation field ${normalized.name} requires target`);
    }

    normalized.interface =
      normalized.interface ||
      {
        belongsTo: 'm2o',
        hasMany: 'o2m',
        hasOne: 'oho',
        belongsToMany: 'm2m',
      }[normalized.type];

    normalized.sourceKey = normalized.sourceKey || 'id';
    normalized.targetKey = normalized.targetKey || 'id';

    if (normalized.type === 'belongsTo') {
      normalized.foreignKey = normalized.foreignKey || buildRelationKeyName(normalized.name, normalized.targetKey);
    }

    if (normalized.type === 'hasMany' || normalized.type === 'hasOne') {
      normalized.foreignKey = normalized.foreignKey || buildRelationKeyName(collectionName, normalized.sourceKey);
    }

    if (normalized.type === 'belongsToMany') {
      normalized.foreignKey = normalized.foreignKey || buildRelationKeyName(collectionName, normalized.sourceKey);
      normalized.otherKey = normalized.otherKey || buildRelationKeyName(normalized.target, normalized.targetKey);
      normalized.through = normalized.through || buildThroughName(collectionName, normalized.target);
    }

    normalized.uiSchema = lodash.merge(
      {
        type: normalized.type === 'belongsTo' || normalized.type === 'hasOne' ? 'object' : 'array',
        title: normalized.title || normalized.uiSchema?.title || normalized.name,
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: normalized.type === 'hasMany' || normalized.type === 'belongsToMany',
          fieldNames: {
            value: normalized.targetKey,
            label: normalized.targetTitleField || normalized.titleField || normalized.targetKey,
          },
        },
      },
      normalized.uiSchema || {},
    );
  }

  delete normalized.settings;
  delete normalized.title;
  delete normalized.titleField;
  delete normalized.targetTitleField;

  return normalized;
}

function validateExternalRelationField(values: any) {
  if (!RELATION_TYPES.has(values.type)) {
    return;
  }

  const validatePresent = (name: string) => {
    if (!values[name]) {
      throw new Error(`"${name}" is required`);
    }
  };

  const validatePresents = (names: string[]) => names.forEach((name) => validatePresent(name));

  if (values.type === 'belongsTo') {
    validatePresents(['foreignKey', 'targetKey', 'target']);
  }

  if (values.type === 'hasMany' || values.type === 'hasOne') {
    validatePresents(['foreignKey', 'sourceKey', 'target']);
  }

  if (values.type === 'belongsToMany') {
    validatePresents(['foreignKey', 'otherKey', 'sourceKey', 'targetKey', 'through', 'target']);
  }
}

function getFieldOptions(ctx, values: any) {
  return ctx.app.dataSourceManager.dataSources
    .get(values.dataSourceKey)
    .collectionManager.getCollection(values.collectionName)
    .getField(values.name)?.options;
}

export async function applyExternalFieldDefinition(
  ctx,
  rawValues: any,
  defaults: {
    dataSourceKey?: string;
    collectionName?: string;
  } = {},
) {
  const values = normalizeExternalFieldInput(rawValues, defaults);

  validateExternalRelationField(values);

  const dataSource = ctx.app.dataSourceManager.dataSources.get(values.dataSourceKey);
  if (!dataSource) {
    throw new Error(`dataSource ${values.dataSourceKey} not found`);
  }
  const collection = dataSource.collectionManager.getCollection(values.collectionName);
  if (!collection) {
    throw new Error(`collection ${values.collectionName} not found in dataSource ${values.dataSourceKey}`);
  }

  const repository = ctx.app.db.getRepository('dataSourcesFields');
  const filter = {
    name: values.name,
    collectionName: values.collectionName,
    dataSourceKey: values.dataSourceKey,
  };
  const existing = await repository.findOne({ filter });

  if (existing) {
    await repository.update({
      filter,
      values,
    });
  } else {
    await repository.create({
      values,
    });
  }

  return getFieldOptions(ctx, values);
}
