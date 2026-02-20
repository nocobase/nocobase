/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useCollectionManager_deprecated, useCompile } from '@nocobase/client';

export const useFields = (collectionName: string) => {
  const fieldSchema = useFieldSchema();
  const nonfilterable = fieldSchema?.['x-component-props']?.nonfilterable || [];
  const { getCollectionFields } = useCollectionManager_deprecated();
  const fields = getCollectionFields(collectionName);
  const compile = useCompile();
  const field2option = (field, depth) => {
    if (!field.interface) {
      return;
    }
    const option = {
      name: field.name,
      title: compile(field?.uiSchema?.title) || field.name,
      schema: field?.uiSchema,
    };
    if (!field.target || depth >= 3) {
      return option;
    }

    if (field.target && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'].includes(field.type)) {
      const targetFields = getCollectionFields(field.target);
      const options = getOptions(targetFields, depth + 1).filter(Boolean);
      option['children'] = option['children'] || [];
      option['children'].push(...options);
    }
    return option;
  };
  const getOptions = (fields, depth) => {
    const options = [];
    fields.forEach((field) => {
      const option = field2option(field, depth);
      if (option) {
        options.push(option);
      }
    });
    return options;
  };
  return getOptions(fields, 1);
};
