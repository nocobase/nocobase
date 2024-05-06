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

const schema: ISchema = {
  type: 'void',
  name: 'root',
  'x-decorator': 'FormV2',
  'x-component': 'ShowFormData',
  'x-pattern': 'readPretty',
  properties: {
    test: {
      type: 'boolean',
      default: true,
      title: 'Test1',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    test2: {
      type: 'boolean',
      default: false,
      title: 'Test2',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
    test3: {
      type: 'boolean',
      default: false,
      title: 'Test3',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      'x-component-props': {
        showUnchecked: true,
      },
    },
  },
};

const Demo = () => {
  return <SchemaComponent schema={schema} components={{ FormV2, ShowFormData, FormItem, Checkbox }} />;
};

const app = new Application({ providers: [Demo] });

export default app.getRootComponent();
