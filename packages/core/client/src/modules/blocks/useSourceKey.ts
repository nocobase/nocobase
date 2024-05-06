/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCollectionManager } from '../../data-source/collection/CollectionManagerProvider';

/**
 * 用于获取关系字段的 source collection 的 key
 * @param association string
 * @returns
 */
export const useSourceKey = (association: string) => {
  const cm = useCollectionManager();
  return cm.getSourceKeyByAssociation(association);
};
