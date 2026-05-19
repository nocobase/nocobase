/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from '@nocobase/database';

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

export const isBuiltInText = (row: LocalizationTextRecord, resources: Record<string, Record<string, string>>) => {
  const moduleName = getModuleName(row);
  return Boolean(moduleName && resources[moduleName]);
};

export const hasBuiltInTranslation = (
  row: LocalizationTextRecord,
  resources: Record<string, Record<string, string>>,
) => {
  const moduleName = getModuleName(row);
  const translation = moduleName ? resources[moduleName]?.[row.text] : undefined;
  return translation !== undefined && translation !== '';
};

export const matchesScope = (
  row: LocalizationTextRecord,
  resources: Record<string, Record<string, string>>,
  scope: TranslationScope = 'all',
) => {
  if (scope === 'all') {
    return true;
  }
  const isBuiltIn = isBuiltInText(row, resources);
  return scope === 'builtIn' ? isBuiltIn : !isBuiltIn;
};

export const getBuiltInReference = (row: LocalizationTextRecord, resources: Record<string, Record<string, string>>) => {
  const moduleName = getModuleName(row);
  return moduleName ? resources[moduleName]?.[row.text] : undefined;
};

const getBuiltInModules = async (app: any) => {
  const builtInResources = await app.localeManager.getBuiltInResources('en-US');
  return Object.keys(builtInResources).map((module) => `resources.${module}`);
};

const getTranslatedBuiltInResourceConditions = (resources: Record<string, Record<string, string>>) => {
  return Object.entries(resources)
    .map(([module, translations]) => {
      const texts = Object.entries(translations)
        .filter(([, translation]) => translation !== undefined && translation !== '')
        .map(([text]) => text);

      if (!texts.length) {
        return;
      }

      return {
        module: `resources.${module}`,
        text: {
          [Op.in]: texts,
        },
      };
    })
    .filter(Boolean);
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
    findOptions.filter = {
      id: {
        $in: textIds || [],
      },
    };
  }

  if (scope !== 'all') {
    const builtInModules = await getBuiltInModules(app);
    findOptions.filter = {
      ...(findOptions.filter || {}),
      module: {
        [scope === 'builtIn' ? '$in' : '$notIn']: builtInModules,
      },
    };
  }

  if (mode === 'incremental') {
    findOptions.include = [{ association: 'translations', where: { locale }, required: false }];
    addWhereCondition(findOptions, {
      '$translations.id$': null,
    });

    const targetBuiltInResources = await app.localeManager.getBuiltInResources(locale);
    const translatedBuiltInConditions = getTranslatedBuiltInResourceConditions(targetBuiltInResources);
    if (translatedBuiltInConditions.length) {
      addWhereCondition(findOptions, {
        [Op.not]: {
          [Op.or]: translatedBuiltInConditions,
        },
      });
    }
  }

  return findOptions;
};
