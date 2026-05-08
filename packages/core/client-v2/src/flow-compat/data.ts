/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getCollectionFieldInterface } from '@nocobase/flow-engine';
import type { CollectionFieldInterfaceDataSourceManager } from '@nocobase/flow-engine';

export interface CollectionFieldOptions {
  interface?: string;
  [key: string]: any;
}

type FieldInterfaceOptions = { titleUsable?: boolean } | null | undefined;

export const DEFAULT_DATA_SOURCE_KEY = 'main';

export const getFlowFieldInterfaceOptions = (
  interfaceName: string | undefined,
  ...dataSourceManagers: Array<CollectionFieldInterfaceDataSourceManager | null | undefined>
) => getCollectionFieldInterface(interfaceName, ...dataSourceManagers);

export const hasFlowFieldInterfaceLookup = (
  ...dataSourceManagers: Array<CollectionFieldInterfaceDataSourceManager | null | undefined>
) =>
  dataSourceManagers.some(
    (dataSourceManager) => typeof dataSourceManager?.collectionFieldInterfaceManager?.getFieldInterface === 'function',
  );

export const isTitleFieldInterface = (fieldInterfaceOptions: FieldInterfaceOptions) => {
  return fieldInterfaceOptions?.titleUsable;
};

export const isTitleField = (
  dataSourceManager: CollectionFieldInterfaceDataSourceManager | null | undefined,
  field: CollectionFieldOptions | null | undefined,
) => {
  return isTitleFieldInterface(getFlowFieldInterfaceOptions(field?.interface, dataSourceManager));
};
