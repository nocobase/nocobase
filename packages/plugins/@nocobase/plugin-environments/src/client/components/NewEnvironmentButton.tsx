/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { Checkbox, FormButtonGroup, FormDrawer, FormItem, FormLayout, Input, Reset, Submit } from '@formily/antd-v5';
import { createSchemaField } from '@formily/react';
import { useAPIClient } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input,
    Checkbox,
  },
});

const schema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    default: {
      type: 'string',
      'x-content': 'Default environment',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
};

export function NewEnvironmentButton({ onSuccess }) {
  const api = useAPIClient();
  return (
    <Button
      block
      style={{ textAlign: 'left' }}
      type="text"
      icon={<PlusOutlined />}
      onClick={() => {
        FormDrawer('New environment', () => {
          return (
            <FormLayout layout={'vertical'}>
              <SchemaField schema={schema} />
              <FormDrawer.Footer>
                <FormButtonGroup align="right">
                  <Reset>Cancel</Reset>
                  <Submit
                    onSubmit={async (data) => {
                      await api.request({
                        url: 'environments:create',
                        method: 'post',
                        data,
                      });
                      onSuccess(data);
                    }}
                  >
                    Submit
                  </Submit>
                </FormButtonGroup>
              </FormDrawer.Footer>
            </FormLayout>
          );
        })
          .open({})
          .then(console.log)
          .catch(console.log);
      }}
    >
      New environment
    </Button>
  );
}
