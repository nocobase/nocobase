/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, createContext } from 'react';

interface TreeRecordContextProps {
  parent: any;
}

const TreeRecordContext = createContext<TreeRecordContextProps>(null);

/**
 * Tree Table 的上下文，用于在 Tree Table 中替代 RecordProvider。因为 RecordProvider 用在 Tree Table 中会有问题（和关系区块有冲突）
 * @param param0
 * @returns
 */
export const TreeRecordProvider: FC<TreeRecordContextProps> = ({ children, parent }) => {
  return <TreeRecordContext.Provider value={{ parent }}>{children}</TreeRecordContext.Provider>;
};

export const useTreeParentRecord = () => {
  const context = React.useContext(TreeRecordContext);
  return context?.parent;
};
