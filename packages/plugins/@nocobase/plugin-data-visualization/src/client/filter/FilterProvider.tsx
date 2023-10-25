import React, { createContext, useState } from 'react';
import { useMemoizedFn } from 'ahooks';

export const ChartFilterContext = createContext<{
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  fields: {
    [collection: string]: {
      [field: string]: {
        title: string;
        operator?: {
          value: string;
          noValue?: boolean;
        };
      };
    };
  };
  addField: (name: string, field: { title: string; operator?: string }) => void;
  removeField: (name: string) => void;
  collapse: boolean;
  setCollapse: (collapsed: boolean) => void;
}>({} as any);

export const ChartFilterProvider: React.FC = (props) => {
  const [enabled, setEnabled] = useState(false);
  const [fields, setFields] = useState({});
  const [collapse, setCollapse] = useState(false);
  const addField = useMemoizedFn((name: string, props: { title: string }) => {
    const [collection, field] = name.split('.');
    setFields((fields) => ({
      ...fields,
      [collection]: {
        ...(fields[collection] || {}),
        [field]: props,
      },
    }));
  });
  const removeField = useMemoizedFn((name: string) => {
    const [collection, field] = name.split('.');
    setFields((fields) => {
      const newFields = {
        ...fields,
      };
      newFields[collection][field] = undefined;
      return newFields;
    });
  });
  return (
    <ChartFilterContext.Provider value={{ enabled, setEnabled, fields, addField, removeField, collapse, setCollapse }}>
      {props.children}
    </ChartFilterContext.Provider>
  );
};
