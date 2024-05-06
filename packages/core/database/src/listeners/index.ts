/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '../database';
import { beforeDefineAdjacencyListCollection } from './adjacency-list';
import { appendChildCollectionNameAfterRepositoryFind } from './append-child-collection-name-after-repository-find';

export const registerBuiltInListeners = (db: Database) => {
  db.on('beforeDefineCollection', beforeDefineAdjacencyListCollection);
  db.on('afterRepositoryFind', appendChildCollectionNameAfterRepositoryFind(db));
};
