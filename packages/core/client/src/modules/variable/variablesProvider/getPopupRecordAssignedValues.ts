/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldOptions_deprecated } from '../../../collection-manager';

export const CURRENT_POPUP_RECORD_VARIABLE = '{{$nPopupRecord}}';

const associationPriority = {
  belongsTo: 1,
  hasOne: 2,
  belongsToMany: 3,
  hasMany: 4,
  linkTo: 5,
};

export function getPopupRecordAssignedValues(options: {
  collectionName?: string;
  collectionFields?: CollectionFieldOptions_deprecated[];
  popupCollectionName?: string;
}) {
  const { collectionName, collectionFields = [], popupCollectionName } = options;

  if (!collectionName || !popupCollectionName || collectionName === popupCollectionName) {
    return {};
  }

  const candidates = collectionFields
    .filter((field) => {
      if (!field?.name || !field?.target) {
        return false;
      }

      if (field.target !== popupCollectionName) {
        return false;
      }

      return ['belongsTo', 'hasOne', 'belongsToMany', 'hasMany', 'linkTo'].includes(field.type);
    })
    .sort((a, b) => {
      const left = associationPriority[a.type] ?? Number.MAX_SAFE_INTEGER;
      const right = associationPriority[b.type] ?? Number.MAX_SAFE_INTEGER;
      return left - right;
    });

  const field = candidates[0];

  if (!field) {
    return {};
  }

  return {
    [field.name]: CURRENT_POPUP_RECORD_VARIABLE,
  };
}
