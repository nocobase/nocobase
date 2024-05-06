/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection } from '@nocobase/database';
import list from './collection';
import associations from './associations';

export default (collection: Collection, options) => {
  const paths = list(collection);

  if (options.withAssociation && !isViewCollection(collection)) {
    Object.assign(paths, associations(collection));
  }

  return paths;
};

export function hasSortField(collection: Collection) {
  for (const field of collection.fields.values()) {
    if (field.type === 'sort') {
      return true;
    }
  }

  return false;
}

export function readOnlyCollection(collection: Collection) {
  return isViewCollection(collection) && collection.options?.writableView == false;
}

export function isViewCollection(collection: Collection) {
  return collection.isView();
}
