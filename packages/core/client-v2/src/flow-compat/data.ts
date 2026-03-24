/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface CollectionFieldOptions {
  interface?: string;
  [key: string]: any;
}

export interface DataSourceManager {
  collectionFieldInterfaceManager: {
    getFieldInterface: (name: string) => { titleUsable?: boolean } | undefined;
  };
  getDataSource?: (key?: string) => {
    reload?: () => Promise<any> | any;
  } | null;
}

export const DEFAULT_DATA_SOURCE_KEY = 'main';

export const isTitleField = (dm: DataSourceManager, field: CollectionFieldOptions) => {
  return dm.collectionFieldInterfaceManager.getFieldInterface(field.interface)?.titleUsable;
};
