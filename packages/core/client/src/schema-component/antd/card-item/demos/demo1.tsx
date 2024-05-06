/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CardItem, FormProvider, SchemaComponent } from '@nocobase/client';
import React from 'react';

const schema = {
  type: 'object',
  properties: {
    card: {
      type: 'void',
      'x-component': 'CardItem',
      'x-component-props': {
        title: 'Card',
      },
      properties: {
        hello: {
          type: 'void',
          'x-component': 'div',
          'x-content': 'Hello Card!',
        },
      },
    },
  },
};

export default () => {
  return (
    <FormProvider>
      <SchemaComponent components={{ CardItem }} schema={schema} />
    </FormProvider>
  );
};
