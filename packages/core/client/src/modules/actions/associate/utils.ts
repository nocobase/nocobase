/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const hasValue = (value: any) => value !== undefined && value !== null && value !== '';

export const buildToManyAssociationFilter = (collectionField: any, record: any) => {
  if (!collectionField || !['oho', 'o2m'].includes(collectionField.interface) || !collectionField.foreignKey) {
    return {};
  }

  const sourceKey = collectionField.sourceKey || 'id';
  const sourceValue = record?.[sourceKey];
  if (!hasValue(sourceValue)) {
    return {
      [collectionField.foreignKey]: {
        $is: null,
      },
    };
  }

  return {
    $or: [
      {
        [collectionField.foreignKey]: {
          $is: null,
        },
      },
      {
        [collectionField.foreignKey]: {
          $eq: sourceValue,
        },
      },
    ],
  };
};
