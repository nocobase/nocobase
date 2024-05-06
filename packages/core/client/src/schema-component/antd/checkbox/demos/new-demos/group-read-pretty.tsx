/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Checkbox, FormItem, FormV2, SchemaComponent, ShowFormData, ISchema } from '@nocobase/client';
import React from 'react';

const options = [
  {
    label: '选项1',
    value: 1,
    color: 'red',
  },
  {
    label: '选项2',
    value: 2,
    color: 'blue',
  },
  {
    label: '选项3',
    value: 3,
    color: 'yellow',
  },
];

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test1: {
      type: 'array',
      default: [1, 2],
      title: 'Test1',
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
    },
    test2: {
      type: 'array',
      default: [1, 2, 3],
      title: 'Test2',
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
      'x-decorator-props': {
        style: {
          width: 100,
        },
      },
      'x-component-props': {
        ellipsis: true,
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} components={{ FormV2, ShowFormData, FormItem, Checkbox }} />;
};

const app = new Application({ providers: [Demo] });

export default app.getRootComponent();
