/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionField } from '@nocobase/flow-engine';

export const fieldsToOptions = (fields, depth, nonfilterable, t) => {
  return fields
    .map((field) => {
      return field2option(field, depth, nonfilterable, t);
    })
    .filter(Boolean);
};

const field2option = (field: CollectionField, depth, nonfilterable, t) => {
  if (nonfilterable.length && depth === 1 && nonfilterable.includes(field.name)) {
    return;
  }
  if (!field.interface) {
    return;
  }
  if (field.filterable === false) {
    return;
  }
  const fieldInterface = field.getInterfaceOptions();
  if (!fieldInterface?.filterable) {
    return;
  }
  const { nested, children, operators } = fieldInterface.filterable;
  const option = {
    name: field.name,
    type: field.type,
    target: field.target,
    title: t(field.title),
    schema: field?.uiSchema,
    operators: (
      operators?.filter?.((operator) => {
        return !operator?.visible || operator.visible(field);
      }) || []
    ).map((operator) => {
      return {
        ...operator,
        label: t(operator.label),
      };
    }),
  };
  if (field.target && depth > 2) {
    return;
  }
  if (depth > 2) {
    return option;
  }
  if (children?.length) {
    option['children'] = children;
  }
  if (nested) {
    const targetFields = field.getFields().filter((f) => {
      // 过滤掉附件字段，因为会报错：Target collection attachments not found for field xxx
      return f.target !== 'attachments' && f.interface !== 'formula';
    });
    const options = fieldsToOptions(targetFields, depth + 1, nonfilterable, t).filter(Boolean);
    option['children'] = option['children'] || [];
    option['children'].push(...options);
  }
  return option;
};
