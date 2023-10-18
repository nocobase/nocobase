import React, { createContext, useContext, useMemo, useRef } from 'react';

interface FormActiveFieldsProviderValue {
  getActiveFieldsName: (name: string) => string[];
  addActiveFieldName: (fieldName: string) => void;
  removeActiveFieldName: (fieldName: string) => void;
  name: string;
  parent: FormActiveFieldsProviderValue;
}

const FormActiveFieldsContext = createContext<FormActiveFieldsProviderValue>(null);

interface ProviderProps extends Partial<FormActiveFieldsProviderValue> {
  children: React.ReactNode;
}

/**
 * 用于提供获取和更新当前表单区块中已显示出来的字段
 * @param param0
 * @returns
 */
export const FormActiveFieldsProvider = ({
  children,
  name,
  getActiveFieldsName,
  addActiveFieldName,
  removeActiveFieldName,
}: ProviderProps) => {
  const activeFieldsNameRef = useRef<Set<string>>(new Set());
  const upLevelContext = useContext(FormActiveFieldsContext);

  const value = useMemo(() => {
    return {
      getActiveFieldsName:
        getActiveFieldsName ||
        ((_name: string) => {
          if (!_name || _name === name) {
            return Array.from(activeFieldsNameRef.current);
          }
          return upLevelContext?.getActiveFieldsName(_name);
        }),
      addActiveFieldName:
        addActiveFieldName ||
        ((field: string) => {
          activeFieldsNameRef.current.add(field);
        }),
      removeActiveFieldName:
        removeActiveFieldName ||
        ((field: string) => {
          activeFieldsNameRef.current.delete(field);
        }),
      name,
      parent: upLevelContext,
    };
  }, [addActiveFieldName, getActiveFieldsName, name, removeActiveFieldName, upLevelContext]);

  return <FormActiveFieldsContext.Provider value={value}>{children}</FormActiveFieldsContext.Provider>;
};

/**
 * 用于获取和更新当前表单区块中已显示出来的字段
 * @returns
 */
export const useFormActiveFields = () => {
  return useContext(FormActiveFieldsContext);
};
