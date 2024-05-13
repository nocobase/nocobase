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
import { useEffect, useMemo } from 'react';
import { useForm } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { App as AntdApp } from 'antd';

import { useAPIClient, useRequest } from '../../../api-client/hooks';
import { SchemaComponent } from '../../../schema-component';
import React from 'react';
import { uid } from '@formily/shared';

export function usePluginSettingData(packageName: string) {
  const apiClient = useAPIClient();
  const { data, loading, ...reset } = useRequest<any>(() =>
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

  const dataValue = useMemo(() => data?.data?.data?.options || {}, [data]);

  return {
    loading,
    data: dataValue,
    ...reset,
  };
}

export function useUpdatePluginSettingData(packageName: string, onSuccess?: (values?: any) => void) {
  const apiClient = useAPIClient();
  const { t } = useTranslation(packageName, { nsMode: 'fallback' });
  const { message } = AntdApp.useApp();

  return useRequest(
    (values) =>
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
        onSuccess && onSuccess();
      },
    },
  );
}

export interface CreatePluginSettingFormOptions<T = {}> {
  packageName: string;
  fields: ISchema['properties'];
  initialValues?: T;
  processValues?: (values: T) => T;
  onUpdateSuccess?: (values: T) => void;
  onGetSuccess?: (values: T) => void;
}

export function createPluginSettingForm<T = {}>(options: CreatePluginSettingFormOptions<T>) {
  const {
    fields,
    initialValues,
    onGetSuccess,
    onUpdateSuccess,
    processValues = (values) => values,
    packageName,
  } = options;
  const useCustomFormProps = () => {
    const { data, loading } = usePluginSettingData(packageName);

    const form = useMemo(
      () =>
        createForm({
          initialValues,
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
    const { runAsync, loading } = useUpdatePluginSettingData(packageName, onUpdateSuccess);
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
          reset: {
            title: '{{t("Reset")}}',
            'x-component': 'Action',
            'x-use-component-props': useResetActionProps,
          },
        },
      },
    },
  };

  const render = () => <SchemaComponent schema={schema} />;

  return {
    schema,
    render,
  };
}
