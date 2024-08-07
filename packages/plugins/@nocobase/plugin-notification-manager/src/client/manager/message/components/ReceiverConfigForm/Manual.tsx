/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { FormItem, Input, SchemaComponent, Space } from '@nocobase/client';
import { Radio } from 'antd';
import { ArrayField as ArrayFieldModel, VoidField } from '@formily/core';
import { ArrayField, Field, useField, observer } from '@formily/react';
import { useNotificationTranslation } from '../../../../locale';
import { ArrayItems } from '@formily/antd-v5';
import { ISchema } from '@formily/react';

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
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          input: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
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
          'x-component': 'ArrayItems.Addition',
        },
      },
    };

    return <SchemaComponent schema={schema} />;
  },
  { displayName: 'ConfigForm' },
);

// export const ManualConfigForm = () => (
//   <ArrayField name="receivers" component={[InnerManualConfigForm]} disabled={false} />
// );
