/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useAsyncData,
  useRecord,
  useRequest,
  useResourceActionContext,
  useResourceContext,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { authenticatorsSchema, createFormSchema } from './schemas/authenticators';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { AuthTypeContext, AuthTypesContext, useAuthTypes } from './authType';
import { useValuesFromOptions, Options } from './Options';
import { useTranslation } from 'react-i18next';
import { useAuthTranslation } from '../locale';
import { Schema, useField, useForm } from '@formily/react';

function recursiveTrim(obj: Record<string, any> | string | any[]) {
  if (typeof obj === 'string') {
    return obj.trim();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => recursiveTrim(item));
  }

  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, recursiveTrim(value)]));
  }

  return obj;
}

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const AddNew = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState('');
  const types = useAuthTypes();
  const items = types.map((item) => ({
    ...item,
    onClick: () => {
      setVisible(true);
      setType(item.value);
    },
  }));

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <AuthTypeContext.Provider value={{ type }}>
        <Dropdown menu={{ items }}>
          <Button icon={<PlusOutlined />} type={'primary'}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        <SchemaComponent scope={{ useCloseAction, types, setType, useCreateAction }} schema={createFormSchema} />
      </AuthTypeContext.Provider>
    </ActionContextProvider>
  );
};

// Disable delete button when there is only one authenticator
const useCanNotDelete = () => {
  const { data } = useAsyncData();
  // return data?.meta?.count === 1;
  return false;
};

export const useCreateAction = () => {
  const form = useForm();
  const field = useField();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource } = useResourceContext();
  return {
    async run() {
      try {
        await form.submit();
        field.data = field.data || {};
        field.data.loading = true;
        const options = form.values.options || {};
        await resource.create({
          values: {
            ...form.values,
            options: recursiveTrim(options),
          },
        });
        ctx.setVisible(false);
        field.data.loading = false;
        refresh();
      } catch (error) {
        if (field.data) {
          field.data.loading = false;
        }
      }
    },
  };
};

export const useUpdateAction = () => {
  const field = useField();
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const { resource, targetKey } = useResourceContext();
  const { [targetKey]: filterByTk } = useRecord();
  return {
    async run() {
      await form.submit();
      field.data = field.data || {};
      field.data.loading = true;
      try {
        const options = form.values.options || {};
        await resource.update({
          filterByTk,
          values: {
            ...form.values,
            options: recursiveTrim(options),
          },
        });
        ctx.setVisible(false);
        refresh();
      } catch (e) {
        console.log(e);
      } finally {
        field.data.loading = false;
      }
    },
  };
};

export const Authenticator = () => {
  const { t } = useAuthTranslation();
  const [types, setTypes] = useState([]);
  const api = useAPIClient();
  useRequest(
    () =>
      api
        .resource('authenticators')
        .listTypes()
        .then((res) => {
          const types = res?.data?.data || [];
          return types.map((type: { name: string; title?: string }) => ({
            key: type.name,
            label: Schema.compile(type.title || type.name, { t }),
            value: type.name,
          }));
        }),
    {
      onSuccess: (types) => {
        setTypes(types);
      },
    },
  );

  return (
    <Card bordered={false}>
      <AuthTypesContext.Provider value={{ types }}>
        <SchemaComponent
          schema={authenticatorsSchema}
          components={{ AddNew, Options }}
          scope={{ types, useValuesFromOptions, useCanNotDelete, t, useUpdateAction }}
        />
      </AuthTypesContext.Provider>
    </Card>
  );
};
