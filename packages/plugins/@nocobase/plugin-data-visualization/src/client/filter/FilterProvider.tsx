import React, { createContext, useEffect, useState } from 'react';
import { useMemoizedFn } from 'ahooks';

type FilterField = {
  title?: string;
  operator?: {
    value: string;
    noValue?: boolean;
  };
};

export const ChartFilterContext = createContext<{
  ready: boolean;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  fields: {
    [name: string]: FilterField;
  };
  setField: (name: string, field: FilterField) => void;
  removeField: (name: string) => void;
  collapse: {
    collapsed: boolean;
    row: number;
  };
  setCollapse: (opts: { collapsed?: boolean; row?: number }) => void;
  form: any;
  setForm: (form: any) => void;
}>({} as any);
ChartFilterContext.displayName = 'ChartFilterContext';

export const ChartFilterProvider: React.FC = (props) => {
  const [ready, setReady] = useState(false);
  const [enabled, _setEnabled] = useState(false);
  const [fields, setFields] = useState({});
  const [collapse, _setCollapse] = useState({ collapsed: false, row: 1 });
  const [form, _setForm] = useState<any>();
  const setField = useMemoizedFn((name: string, props: FilterField) => {
    setFields((fields) => ({
      ...fields,
      [name]: {
        ...(fields[name] || {}),
        ...props,
      },
    }));
  });
  const removeField = useMemoizedFn((name: string) => {
    setFields((fields) => {
      const newFields = {
        ...fields,
      };
      newFields[name] = undefined;
      return newFields;
    });
  });
  const setForm = useMemoizedFn(_setForm);
  const setEnabled = useMemoizedFn(_setEnabled);
  const setCollapse = ({ collapsed, row }: { collapsed?: boolean; row?: number }) => {
    _setCollapse((collapse) => ({
      collapsed: collapsed !== undefined ? collapsed : collapse.collapsed,
      row: row !== undefined ? row : collapse.row,
    }));
  };
  useEffect(() => setReady(true), []);
  return (
    <ChartFilterContext.Provider
      value={{ ready, enabled, setEnabled, fields, setField, removeField, collapse, setCollapse, form, setForm }}
    >
      {props.children}
    </ChartFilterContext.Provider>
  );
};
