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
