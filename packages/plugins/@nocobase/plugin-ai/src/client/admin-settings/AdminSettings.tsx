/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, useAPIClient, useRequest } from '@nocobase/client';
import React, { useMemo } from 'react';
import { Card, App } from 'antd';
import { useT } from '../locale';
import { createForm } from '@formily/core';
import { useForm } from '@formily/react';

const useFormProps = () => {
  const api = useAPIClient();
  const { data } = useRequest(() =>
    api
      .resource('aiSettings')
      .get()
      .then((res) => res?.data?.data),
  );
  const form = useMemo(
    () =>
      createForm({
        initialValues: data,
      }),
    [data],
  );
  return {
    form,
  };
};

const useSubmitActionProps = () => {
  const form = useForm();
  const api = useAPIClient();
  const { message } = App.useApp();
  const t = useT();

  return {
    type: 'primary',
    htmlType: 'submit',
    async onClick() {
      await form.submit();
      await api.resource('aiSettings').update({
        values: form.values,
        filterByTk: 1,
      });
      message.success(t('Saved successfully'));
    },
  };
};

export const AdminSettings: React.FC = () => {
  const t = useT();
  return (
    <Card>
      <SchemaComponent
        scope={{ t, useFormProps, useSubmitActionProps }}
        schema={{
          type: 'void',
          name: 'ai-settings',
          'x-component': 'FormV2',
          'x-use-component-props': 'useFormProps',
          properties: {
            storage: {
              type: 'string',
              'x-decorator': 'FormItem',
              title: '{{ t("Files storage") }}',
              'x-component': 'RemoteSelect',
              'x-component-props': {
                service: {
                  resource: 'aiSettings',
                  action: 'listStorages',
                },
                manual: false,
              },
              default: 'local',
            },
            submit: {
              type: 'void',
              'x-component': 'Action',
              title: '{{t("Save")}}',
              'x-component-props': {
                type: 'primary',
              },
              'x-use-component-props': 'useSubmitActionProps',
            },
          },
        }}
      />
    </Card>
  );
};
