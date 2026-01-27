/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useContext } from 'react';
import { Collection } from '@nocobase/flow-engine';
import { createContext } from 'react';

export class CurrentCollection {
  constructor(public readonly collection: Collection) {}
  get displayName() {
    return this.collection ? `${this.collection.dataSource.displayName} / ${this.collection.title}` : '';
  }
}

export const CollectionContext = createContext<CurrentCollection>(null);
export const useCollectionContext = () => {
  return useContext(CollectionContext);
};
