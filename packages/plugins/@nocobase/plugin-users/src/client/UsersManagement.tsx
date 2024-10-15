/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  SchemaComponent,
  SchemaComponentContext,
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
  useSchemaComponentContext,
  useRequest,
  useAPIClient,
} from '@nocobase/client';
import React, { createContext, useEffect, useMemo, useContext } from 'react';
import { App, Tabs, message } from 'antd';
import { useForm } from '@formily/react';
import { createForm } from '@formily/core';
import { css } from '@emotion/css';
import { usersSchema, usersSettingsSchema } from './schemas/users';
import { useUsersTranslation } from './locale';
import { PasswordField } from './PasswordField';

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { runAsync } = useDataBlockRequest();
  const { t } = useUsersTranslation();
  const collection = useCollection();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      console.log('values:', values);
      if (values[collection.filterTargetKey]) {
        await resource.update({
          values,
          filterByTk: values[collection.filterTargetKey],
        });
      } else {
        await resource.create({ values });
      }
      await runAsync();
      message.success(t('Saved successfully'));
      setVisible(false);
    },
  };
};

const useEditFormProps = () => {
  const recordData = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: recordData,
      }),
    [recordData],
  );
  return {
    form,
  };
};

const UsersManagementTab: React.FC = () => {
  const { t } = useUsersTranslation();
  const scCtx = useSchemaComponentContext();
  return (
    <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
      <SchemaComponent
        schema={usersSchema}
        scope={{ t, useCancelActionProps, useSubmitActionProps, useEditFormProps }}
        components={{ PasswordField }}
      />
    </SchemaComponentContext.Provider>
  );
};
const UsersSettingsContext = createContext<any>({});

const UsersSettingsProvider = (props) => {
  const result = useRequest({
    url: 'systemSettings:get/1',
  });
  return <UsersSettingsContext.Provider value={result}>{props.children}</UsersSettingsContext.Provider>;
};

const UsersSettingsTab: React.FC = () => {
  const { t } = useUsersTranslation();
  const scCtx = useSchemaComponentContext();
  const form = useForm();
  const useFormBlockProps = () => {
    const result = useContext(UsersSettingsContext);
    useEffect(() => {
      form?.setValues(result?.data?.data);
    }, [result]);
    return {
      form: form,
    };
  };

  const useSubmitActionProps = () => {
    const api = useAPIClient();
    const form = useForm();
    return {
      type: 'primary',
      async onClick() {
        await form.submit();
        const values = form.values;
        await api.request({ url: 'systemSettings:update/1', data: values, method: 'POST' });
        message.success('Submit success');
        window.location.reload();
      },
    };
  };
  return (
    <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
      <SchemaComponent
        schema={usersSettingsSchema}
        scope={{ t, useFormBlockProps, useSubmitActionProps }}
        components={{ UsersSettingsProvider }}
      />
    </SchemaComponentContext.Provider>
  );
};

export const UsersManagement: React.FC = () => {
  const { t } = useUsersTranslation();
  return (
    <Tabs
      defaultActiveKey="usersManager"
      type="card"
      className={css`
        .ant-tabs-nav {
          margin-bottom: 0px;
        }
      `}
      items={[
        {
          label: t('Users manager'),
          key: 'usersManager',
          children: <UsersManagementTab />,
        },
        {
          label: t('Settings'),
          key: 'usersSettings',
          children: <UsersSettingsTab />,
        },
      ]}
    />
  );
};
