/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';

/**
 * 通过 targetKey 判断关系字段的数据是否为空
 * @param value
 * @param targetKey
 * @returns
 */
export const isFieldValueEmpty = (value, targetKey) => {
  if (_.isArray(value)) {
    return _.isEmpty(_.filter(value, (v) => v?.[targetKey] != null));
  }
  return value?.[targetKey] == null;
};

export const isDisplayField = (schemaName: string) => {
  return schemaName.includes('.');
};
