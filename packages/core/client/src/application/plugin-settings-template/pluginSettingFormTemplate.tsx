/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createForm } from '@formily/core';
import { ISchema } from '@formily/json-schema';
import React, { FC, useEffect, useMemo } from 'react';
import { useForm } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { App as AntdApp, Card } from 'antd';
import { uid } from '@formily/shared';

import { useAPIClient, useRequest } from '../../api-client';
import { SchemaComponent } from '../../schema-component';

export function usePluginSettingData<T = {}>(packageName: string) {
  const apiClient = useAPIClient();
  const { data, loading, ...reset } = useRequest<{ data: { data: { options: T } } }>(() =>
    apiClient.request({
      url: 'applicationPlugins:get',
      method: 'GET',
      params: {
        filter: {
          packageName: packageName,
        },
      },
    }),
  );

  const dataValue = useMemo(() => data?.data?.data?.options, [data]);

  return {
    loading,
    data: dataValue,
    ...reset,
  };
}

export function useUpdatePluginSettingData<T = {}>(packageName: string) {
  const apiClient = useAPIClient();
  const { t } = useTranslation(packageName, { nsMode: 'fallback' });
  const { message } = AntdApp.useApp();

  return useRequest(
    (values: T) =>
      apiClient.request({
        url: 'applicationPlugins:update',
        method: 'post',
        params: {
          filter: {
            packageName: packageName,
          },
        },
        data: {
          options: values,
        },
      }),
    {
      manual: true,
      onSuccess() {
        message.success(t('Saved successfully'));
      },
    },
  );
}

const useDefaultInitialValues = () => undefined;

export interface CreatePluginSettingFormOptions<T = {}> {
  packageName: string;
  fields: ISchema['properties'];
  initialValues?: T;
  useInitialValues?: () => T;
  processValues?: (values: T) => T;
  onUpdateSuccess?: (values: T) => void;
  onGetSuccess?: (values: T) => void;
  /**
   * if `initialValues` is not provided, `showResetButton` will be set to false, otherwise true
   */
  showResetButton?: boolean;
}

export function createPluginSettingForm<T = {}>(options: CreatePluginSettingFormOptions<T>) {
  const {
    fields,
    initialValues,
    useInitialValues = useDefaultInitialValues,
    onGetSuccess,
    onUpdateSuccess,
    processValues = (values: T) => values,
    packageName,
    showResetButton,
  } = options;
  const useCustomFormProps = () => {
    const { data, loading } = usePluginSettingData<T>(packageName);
    const hookInitialValues = useInitialValues();
    const form = useMemo(
      () =>
        createForm({
          initialValues: hookInitialValues || initialValues,
        }),
      [initialValues],
    );

    useEffect(() => {
      if (!loading && data) {
        const values = processValues(data);
        form.setValues(values);
        onGetSuccess && onGetSuccess(values);
      }
    }, [data, loading]);

    return {
      form,
    };
  };

  const useResetActionProps = () => {
    const form = useForm();
    return {
      onClick() {
        form.reset();
      },
    };
  };

  const useSubmitActionProps = () => {
    const form = useForm();
    const { runAsync, loading } = useUpdatePluginSettingData(packageName);
    return {
      type: 'primary',
      loading,
      htmlType: 'submit',
      async onClick() {
        await form.submit();
        await runAsync(form.values);
        onUpdateSuccess && onUpdateSuccess(form.values);
      },
    };
  };

  const schema: ISchema = {
    type: 'void',
    name: uid(),
    'x-component': 'FormV2',
    'x-use-component-props': useCustomFormProps,
    properties: {
      ...(fields as any),
      footer: {
        type: 'void',
        'x-component': 'ActionBar',
        'x-component-props': {
          layout: 'one-column',
        },
        properties: {
          submit: {
            title: '{{t("Submit")}}',
            'x-component': 'Action',
            'x-use-component-props': useSubmitActionProps,
          },
          reset: (showResetButton !== undefined ? showResetButton : !!initialValues)
            ? {
                title: '{{t("Reset")}}',
                'x-component': 'Action',
                'x-use-component-props': useResetActionProps,
              }
            : undefined,
        },
      },
    },
  };

  const PluginSettingFormComponent: FC = () => (
    <Card bordered={false}>
      <SchemaComponent schema={schema} />
    </Card>
  );

  return PluginSettingFormComponent;
}
