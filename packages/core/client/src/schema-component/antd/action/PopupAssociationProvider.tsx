import React, { FC, createContext } from 'react';

const PopupAssociationContext = createContext<string>(null);

/**
 * 专门用来为弹窗提供其创建区块所需要的 association 的值
 * @param props
 * @returns
 */
export const PopupAssociationProvider: FC<{ association: string }> = (props) => {
  return (
    <PopupAssociationContext.Provider value={props.association}>{props.children}</PopupAssociationContext.Provider>
  );
};

export const usePopupAssociation = () => {
  return React.useContext(PopupAssociationContext);
};
