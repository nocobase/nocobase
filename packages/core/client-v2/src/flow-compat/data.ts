/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSourceManager } from '@nocobase/flow-engine';

export interface CollectionFieldOptions {
  interface?: string;
  [key: string]: any;
}

export const DEFAULT_DATA_SOURCE_KEY = 'main';

export const isTitleField = (dm: DataSourceManager, field: CollectionFieldOptions) => {
  return dm.collectionFieldInterfaceManager?.getFieldInterface(field.interface)?.titleUsable;
};
