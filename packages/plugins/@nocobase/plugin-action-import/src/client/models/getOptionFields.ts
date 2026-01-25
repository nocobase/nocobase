/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const EXCLUDE_INTERFACES = [
  // 'icon',
  // 'formula',
  // 'attachment',
  // 'markdown',
  // 'richText',
  // 'id',
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  // 'sequence',
];

export const getOptionFields = (fields, t) => {
  const field2option = (field, depth) => {
    if (!field.interface || EXCLUDE_INTERFACES.includes(field.interface)) {
      return;
    }
    const option = {
      name: field.name,
      title: t(field?.uiSchema?.title) || field.name,
      schema: field?.uiSchema,
    };
    if (!field.target || depth >= 2) {
      return option;
    }

    if (field.target && ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'].includes(field.type)) {
      const targetFields = (field.targetCollection && field.targetCollection.getFields()) || [];
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
