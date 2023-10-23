import React, { createContext, useState } from 'react';
import { useMemoizedFn } from 'ahooks';

export const ChartFilterContext = createContext<{
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  customFields: {
    [name: string]: {
      title: string;
    };
  };
  addCustomField: (name: string, field: { title: string }) => void;
  removeCustomField: (name: string) => void;
  collapse: boolean;
  setCollapse: (collapsed: boolean) => void;
}>({} as any);

export const ChartFilterProvider: React.FC = (props) => {
  const [enabled, setEnabled] = useState(false);
  const [customFields, setCustomFields] = useState({});
  const [collapse, setCollapse] = useState(false);
  const addCustomField = useMemoizedFn((name: string, field: { title: string }) => {
    setCustomFields((customFields) => ({ ...customFields, [name]: field }));
  });
  const removeCustomField = useMemoizedFn((name: string) => {
    setCustomFields((customFields) => ({ ...customFields, [name]: undefined }));
  });
  return (
    <ChartFilterContext.Provider
      value={{ enabled, setEnabled, customFields, addCustomField, removeCustomField, collapse, setCollapse }}
    >
      {props.children}
    </ChartFilterContext.Provider>
  );
};
