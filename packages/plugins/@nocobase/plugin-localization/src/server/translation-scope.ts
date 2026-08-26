/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from '@nocobase/database';
import { OFFICIAL_PLUGIN_PREFIX } from '@nocobase/server';

export type TranslationScope = 'all' | 'builtIn' | 'custom';

export type LocalizationTextRecord = {
  id: string | number;
  text: string;
  module?: string;
  translation?: string;
  translationId?: string | number;
};

type BuildFindTextsOptions = {
  app: any;
  mode: string;
  locale: string;
  scope: TranslationScope;
  textIds?: Array<string | number>;
  fields?: string[];
  sort?: string[];
};

export const normalizeTextRecord = (row: any): LocalizationTextRecord | undefined => {
  if (!row) {
    return undefined;
  }
  return typeof row.toJSON === 'function' ? row.toJSON() : row;
};

export const getModuleName = (row: LocalizationTextRecord) => row.module?.replace('resources.', '');

export const normalizeModuleName = (module: string) => {
  return module.startsWith(OFFICIAL_PLUGIN_PREFIX) ? module.replace(OFFICIAL_PLUGIN_PREFIX, '') : module;
};

export const isBuiltInText = (row: LocalizationTextRecord, resources: Record<string, Record<string, string>>) => {
  const moduleName = getModuleName(row);
  return Boolean(moduleName && resources[normalizeModuleName(moduleName)]);
};

const getBuiltInModules = async (app: any) => {
  const builtInResources = await app.localeManager.getBuiltInResources('en-US');
  return Array.from(new Set(Object.keys(builtInResources).map((module) => `resources.${normalizeModuleName(module)}`)));
};

const addWhereCondition = (options: any, condition: any) => {
  if (!options.where) {
    options.where = condition;
    return;
  }
  options.where = {
    [Op.and]: [options.where, condition],
  };
};

export const buildFindTextsOptions = async (options: BuildFindTextsOptions) => {
  const { app, mode, locale, scope = 'all', textIds, fields, sort } = options;
  const findOptions: any = {};

  if (fields) {
    findOptions.fields = fields;
  }
  if (sort) {
    findOptions.sort = sort;
  }
  if (mode === 'selected' || textIds) {
    addWhereCondition(findOptions, {
      id: {
        [Op.in]: textIds || [],
      },
    });
  }

  if (scope !== 'all') {
    const builtInModules = await getBuiltInModules(app);
    addWhereCondition(findOptions, {
      module: {
        [scope === 'builtIn' ? Op.in : Op.notIn]: builtInModules,
      },
    });
  }

  if (mode === 'incremental') {
    findOptions.include = [{ association: 'translations', where: { locale }, required: false }];
    addWhereCondition(findOptions, {
      '$translations.id$': null,
    });
  }

  return findOptions;
};
