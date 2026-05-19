/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type TranslationScope = 'all' | 'builtIn' | 'custom';

export type LocalizationTextRecord = {
  id: string | number;
  text: string;
  module?: string;
  translation?: string;
  translationId?: string | number;
};

type ResolveTextIdsOptions = {
  app: any;
  mode: string;
  locale: string;
  scope?: TranslationScope;
  textIds?: Array<string | number>;
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
  return Boolean(moduleName && resources[moduleName]?.[row.text] !== undefined);
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

export const resolveTextIdsByScope = async (options: ResolveTextIdsOptions) => {
  const { app, mode, locale, scope = 'all', textIds } = options;
  if (scope === 'all' && mode !== 'incremental') {
    return textIds;
  }

  const builtInResources = await app.localeManager.getBuiltInResources('en-US');
  const targetBuiltInResources =
    mode === 'incremental' ? await app.localeManager.getBuiltInResources(locale) : undefined;
  const resolvedTextIds: Array<string | number> = [];
  const findOptions: any = {
    fields: ['id', 'text', 'module'],
    sort: ['id'],
    chunkSize: 500,
  };

  if (textIds) {
    findOptions.filter = {
      id: {
        $in: textIds,
      },
    };
  }

  await app.db.getRepository('localizationTexts').chunkWithCursor({
    ...findOptions,
    callback: async (rows) => {
      for (const row of rows) {
        const record = normalizeTextRecord(row);
        if (
          record &&
          matchesScope(record, builtInResources, scope) &&
          !(targetBuiltInResources && hasBuiltInTranslation(record, targetBuiltInResources))
        ) {
          resolvedTextIds.push(record.id);
        }
      }
    },
  });

  return resolvedTextIds;
};
