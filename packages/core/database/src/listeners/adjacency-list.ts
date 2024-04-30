/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '../collection';

export const beforeDefineAdjacencyListCollection = (options: CollectionOptions) => {
  if (!options.tree) {
    return;
  }
  (options.fields || []).forEach((field) => {
    if (field.treeParent || field.treeChildren) {
      if (!field.target) {
        field.target = options.name;
      }
      if (!field.foreignKey) {
        field.foreignKey = 'parentId';
      }
    }
  });
};
