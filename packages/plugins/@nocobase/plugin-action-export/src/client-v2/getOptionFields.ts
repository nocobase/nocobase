/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildExportFieldLazyChildren,
  buildExportFieldLazyOptions,
  buildExportFieldOptions,
  createExportFieldLazyOptionsCache,
} from './buildExportFieldOptions';

export const getOptionFields = (fields, t) => {
  return buildExportFieldOptions(
    fields,
    (field) => t(field?.uiSchema?.title) || field.name,
    (field) => (field.targetCollection && field.targetCollection.getFields()) || [],
  );
};

export const getLazyOptionFields = (fields, t) => {
  return buildExportFieldLazyOptions(fields, (field) => t(field?.uiSchema?.title) || field.name);
};

export const getLazyOptionChildren = (option, t) => {
  return buildExportFieldLazyChildren(
    option,
    (field) => t(field?.uiSchema?.title) || field.name,
    (field) => (field.targetCollection && field.targetCollection.getFields()) || [],
  );
};

export const createLazyOptionFieldsCache = (fields, t) => {
  return createExportFieldLazyOptionsCache(
    fields,
    (field) => t(field?.uiSchema?.title) || field.name,
    (field) => (field.targetCollection && field.targetCollection.getFields()) || [],
  );
};
