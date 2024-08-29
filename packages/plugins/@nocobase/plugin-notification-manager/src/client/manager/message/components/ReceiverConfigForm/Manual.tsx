/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaComponent } from '@nocobase/client';
import { observer } from '@formily/react';
import { ISchema } from '@formily/react';
import { UsersAddition } from './Users/UsersAddition';

export const ManualConfigForm = observer(
  () => {
    // const field = useField<ArrayFieldModel>();
    // const { t } = useNotificationTranslation();
    // const AddItem = () => {
    //   field.push('');
    // };
    const schema: ISchema = {
      type: 'array',
      name: 'receivers',
      title: 'Receivers',
      'x-decorator': 'FormItem',
      'x-component': 'ArrayItems',
      items: {
        type: 'void',
        'x-component': 'Space',
        properties: {
          input: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Variable.Input',
          },
          remove: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.Remove',
          },
        },
      },
      properties: {
        add: {
          type: 'void',
          title: 'Add entry',
          'x-component': 'UsersAddition',
        },
      },
    };

    return <SchemaComponent schema={schema} components={{ UsersAddition }} />;
  },
  { displayName: 'ConfigForm' },
);

// export const ManualConfigForm = () => (
//   <ArrayField name="receivers" component={[InnerManualConfigForm]} disabled={false} />
// );
