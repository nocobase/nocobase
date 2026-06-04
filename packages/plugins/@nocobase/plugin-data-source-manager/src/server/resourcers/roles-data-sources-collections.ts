/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FullDataRepository } from '../services/full-data-repository';
import lodash from 'lodash';

type UsingConfigType = 'strategy' | 'resourceAction';

type Translator = (key: string, options?: Record<string, unknown>) => string;

type CollectionLike = {
  options: {
    name?: unknown;
    title?: unknown;
    uiSchema?: {
      title?: unknown;
    };
  };
};

const DATA_SOURCE_MANAGER_NAMESPACES = ['client', '@nocobase/plugin-data-source-manager', 'data-source-manager'];
const LEGACY_T_TEMPLATE = /\{\{\s*t\s*\(\s*(['"])(.*?)\1(?:\s*,\s*(\{[\s\S]*?\})\s*)?\)\s*\}\}/g;

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

export function getCollectionTitle(collection: CollectionLike) {
  return collection.options.uiSchema?.title || collection.options.title || '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getTemplateNamespaces(optionsSource?: string) {
  const nsMatches = optionsSource?.match(/['"]?ns['"]?\s*:\s*(?:\[\s*)?(['"])(.*?)\1/);
  return nsMatches?.[2] ? [nsMatches[2], ...DATA_SOURCE_MANAGER_NAMESPACES] : DATA_SOURCE_MANAGER_NAMESPACES;
}

export function compileLegacyTemplateText(value: unknown, t: Translator) {
  if (typeof value !== 'string') {
    return value == null ? '' : String(value);
  }

  return value.replace(LEGACY_T_TEMPLATE, (_source, _quote, key, optionsSource) => {
    return t(key, { ns: getTemplateNamespaces(optionsSource) });
  });
}

function normalizeSearchText(value: unknown) {
  return String(value ?? '').toLowerCase();
}

function getSearchCandidates(values: unknown[], t: Translator) {
  return Array.from(
    new Set(
      values.flatMap((value) => {
        const raw = value == null ? '' : String(value);
        return [raw, compileLegacyTemplateText(raw, t)].filter(Boolean).map(normalizeSearchText);
      }),
    ),
  );
}

function matchOperator(candidates: string[], operator: string, value: unknown) {
  const expected = normalizeSearchText(value);
  if (!expected) {
    return true;
  }

  switch (operator) {
    case '$eq':
      return candidates.some((candidate) => candidate === expected);
    case '$ne':
      return candidates.every((candidate) => candidate !== expected);
    case '$notIncludes':
      return candidates.every((candidate) => !candidate.includes(expected));
    case '$includes':
    default:
      return candidates.some((candidate) => candidate.includes(expected));
  }
}

function matchField(candidates: string[], value: unknown) {
  if (!isRecord(value)) {
    return matchOperator(candidates, '$includes', value);
  }

  const operatorEntries = Object.entries(value).filter(([operator]) => operator.startsWith('$'));
  if (!operatorEntries.length) {
    return true;
  }

  return operatorEntries.every(([operator, operatorValue]) => matchOperator(candidates, operator, operatorValue));
}

export function matchesCollectionSearchFilter(collection: CollectionLike, filter: unknown, t: Translator) {
  if (!isRecord(filter)) {
    return true;
  }

  const results: boolean[] = [];
  if (Array.isArray(filter.$and)) {
    results.push(filter.$and.every((item) => matchesCollectionSearchFilter(collection, item, t)));
  }
  if (Array.isArray(filter.$or)) {
    results.push(filter.$or.some((item) => matchesCollectionSearchFilter(collection, item, t)));
  }

  if (Object.prototype.hasOwnProperty.call(filter, 'title')) {
    results.push(matchField(getSearchCandidates([getCollectionTitle(collection)], t), filter.title));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'name')) {
    results.push(matchField(getSearchCandidates([collection.options.name], t), filter.name));
  }

  return results.length ? results.every(Boolean) : true;
}

const rolesRemoteCollectionsResourcer = {
  name: 'roles.dataSourcesCollections',
  actions: {
    async list(ctx, next) {
      const role = ctx.action.params.associatedIndex;
      const { page = 1, pageSize = 20 } = ctx.action.params;

      const filter = ctx.action.params.filter || {};
      const dataSourceKey = filter.dataSourceKey || ctx.action.params.dataSourceKey;

      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);

      const collectionRepository = new FullDataRepository<any>(dataSource.collectionManager.getCollections());

      // all collections
      const [collections] = await collectionRepository.findAndCount();
      const t = (ctx.i18n?.t || ctx.app.i18n.t).bind(ctx.i18n || ctx.app.i18n);

      const roleResources = await ctx.app.db.getRepository('dataSourcesRolesResources').find({
        filter: {
          roleName: role,
          dataSourceKey,
        },
      });

      // role collections
      const roleResourcesNames = roleResources.map((roleResource) => roleResource.get('name'));

      const roleResourceActionResourceNames = roleResources
        .filter((roleResources) => roleResources.get('usingActionsConfig'))
        .map((roleResources) => roleResources.get('name'));

      const filtedCollections = collections.filter((collection) => {
        return matchesCollectionSearchFilter(collection, filter, t);
      });

      const items = lodash.sortBy(
        filtedCollections.map((collection, i) => {
          const collectionName = collection.options.name;
          const exists = roleResourcesNames.includes(collectionName);

          const usingConfig: UsingConfigType = roleResourceActionResourceNames.includes(collectionName)
            ? 'resourceAction'
            : 'strategy';

          return {
            type: 'collection',
            name: collectionName,
            collectionName,
            title: getCollectionTitle(collection),
            roleName: role,
            usingConfig,
            exists,
            fields: [...collection.fields.values()].map((field) => {
              return field.options;
            }),
          };
        }),
        'name',
      );

      ctx.body = {
        count: filtedCollections.length,
        rows: items,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPage: totalPage(filtedCollections.length, pageSize),
      };

      await next();
    },
  },
};

export { rolesRemoteCollectionsResourcer };
