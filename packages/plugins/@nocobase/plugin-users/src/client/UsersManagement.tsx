/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { createForm } from '@formily/core';
import { useForm } from '@formily/react';
import {
  SchemaComponent,
  SchemaComponentContext,
  useAPIClient,
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
  useRequest,
  useSchemaComponentContext,
} from '@nocobase/client';
import { App, Tabs, message } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useUsersTranslation } from './locale';
import { PasswordField } from './PasswordField';
import { usersSchema, usersSettingsSchema } from './schemas/users';

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
      form.reset();
    },
  };
};

const useSubmitActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const { t } = useUsersTranslation();
  const collection = useCollection();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      if (values[collection.filterTargetKey]) {
        await resource.update({
          values,
          filterByTk: values[collection.filterTargetKey],
        });
      } else {
        await resource.create({ values });
      }
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
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
    const { enableChangePassword, enableEditProfile } = result?.data?.data || {};
    useEffect(() => {
      form?.setValues({
        enableChangePassword: enableChangePassword !== false,
        enableEditProfile: enableEditProfile !== false,
      });
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
        message.success(t('Saved successfully'));
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
