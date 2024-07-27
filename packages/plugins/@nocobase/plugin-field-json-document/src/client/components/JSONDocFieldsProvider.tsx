/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ArrayField } from '@formily/core';

export const JSONDocFieldsContext = React.createContext<{
  form: any;
  field: ArrayField;
  update: (key: string, values: Record<string, any>) => void;
  updateByOption: (key: string, name: string, value: any) => void;
  del: (key: string) => void;
}>(null);

export const JSONDocFieldsProvider: React.FC<{
  field: any;
  form: any;
}> = ({ form, field, children }) => {
  const update = (key: string, values: Record<string, any>) => {
    const fields = [...field.value];
    const index = fields.findIndex((item: any) => item.key === key);
    fields[index] = { ...values };
    field.value = fields;
  };
  const updateByOption = (key: string, name: string, value: any) => {
    const fields = [...field.value];
    const index = fields.findIndex((item: any) => item.key === key);
    fields[index][name] = value;
    field.value = fields;
  };
  const del = (key: string) => {
    const fields = [...field.value];
    const index = fields.findIndex((item: any) => item.key === key);
    fields.splice(index, 1);
    field.value = fields;
  };
  return (
    <JSONDocFieldsContext.Provider value={{ form, field, update, updateByOption, del }}>
      {children}
    </JSONDocFieldsContext.Provider>
  );
};
