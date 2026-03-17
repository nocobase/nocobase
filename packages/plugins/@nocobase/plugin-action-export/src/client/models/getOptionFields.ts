/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { buildExportFieldOptions } from '../buildExportFieldOptions';

export const getOptionFields = (fields, t) => {
  return buildExportFieldOptions(
    fields,
    (field) => t(field?.uiSchema?.title) || field.name,
    (field) => (field.targetCollection && field.targetCollection.getFields()) || [],
  );
};
