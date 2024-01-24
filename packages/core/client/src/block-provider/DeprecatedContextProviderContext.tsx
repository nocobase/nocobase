import { Field } from '@formily/core';
import { useField } from '@formily/react';
import React, { createContext, useContext, useMemo } from 'react';
import { ACLCollectionProvider } from '../acl/ACLProvider';

const DeprecatedContextProviderContext = createContext<{
  blockField: Field;
  parentBlockType: string;
  parentResource: any;
  parentService: any;
}>(null);
/**
 * @deprecated
 * @returns
 */

export const useDeprecatedContext = () => {
  return useContext(DeprecatedContextProviderContext);
};
/**
 * @deprecated
 * 主要用于在向 DataBlockProviderV2 的迁移中，兼容之前的上下文
 * 注意：使用时需放在 DataBlockProviderV2 之下
 */

export const DeprecatedContextProvider = ({ children, parentResource, parentService, parentBlockType }) => {
  const blockField = useField<Field>();

  const result = useMemo(() => {
    return {
      blockField,
      parentBlockType,
      parentResource,
      parentService,
    };
  }, [blockField, parentBlockType, parentResource, parentService]);

  return (
    <DeprecatedContextProviderContext.Provider value={result}>
      <ACLCollectionProvider>{children}</ACLCollectionProvider>
    </DeprecatedContextProviderContext.Provider>
  );
};
