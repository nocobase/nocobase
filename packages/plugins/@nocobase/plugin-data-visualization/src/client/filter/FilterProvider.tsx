import React, { createContext, useEffect, useLayoutEffect, useState } from 'react';
import { useMemoizedFn } from 'ahooks';

export const ChartFilterContext = createContext<{
  ready: boolean;
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
  form: any;
  setForm: (form: any) => void;
}>({} as any);

export const ChartFilterProvider: React.FC = (props) => {
  const [ready, setReady] = useState(false);
  const [enabled, _setEnabled] = useState(false);
  const [fields, setFields] = useState({});
  const [collapse, setCollapse] = useState(false);
  const [form, _setForm] = useState<any>();
  const addField = useMemoizedFn((name: string, props: { title: string }) => {
    const [collection, target, field] = name.split('.');
    const fieldName = field ? `${target}.${field}` : target;
    setFields((fields) => ({
      ...fields,
      [collection]: {
        ...(fields[collection] || {}),
        [fieldName]: props,
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
  const setForm = useMemoizedFn(_setForm);
  const setEnabled = useMemoizedFn(_setEnabled);
  useEffect(() => setReady(true), []);
  return (
    <ChartFilterContext.Provider
      value={{ ready, enabled, setEnabled, fields, addField, removeField, collapse, setCollapse, form, setForm }}
    >
      {props.children}
    </ChartFilterContext.Provider>
  );
};
