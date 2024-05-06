/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Checkbox,
  FormItem,
  FormV2,
  SchemaComponent,
  ShowFormData,
  ISchema,
  SchemaComponentProvider,
} from '@nocobase/client';
import React from 'react';

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  properties: {
    test: {
      type: 'boolean',
      title: 'Test',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
};

const Demo = () => {
  return (
    <SchemaComponentProvider>
      <SchemaComponent schema={schema} components={{ FormV2, ShowFormData, FormItem, Checkbox }} />
    </SchemaComponentProvider>
  );
};

export default Demo;
