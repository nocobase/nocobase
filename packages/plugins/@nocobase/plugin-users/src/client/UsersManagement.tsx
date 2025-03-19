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
  ExtendCollectionsProvider,
  RemoteSchemaComponent,
  SchemaComponent,
  SchemaComponentContext,
  useAPIClient,
  useActionContext,
  useCollection,
  useCollectionManager,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
  useRequest,
  useSchemaComponentContext,
} from '@nocobase/client';
import { App, Spin, Tabs, message } from 'antd';
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
    htmlType: 'submit',
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

const ProfileCreateForm = () => {
  return <RemoteSchemaComponent uid="nocobase-admin-profile-create-form" noForm={true} />;
};

const ProfileEditForm = () => {
  const cm = useCollectionManager();
  const userCollection = cm.getCollection('users');
  const collection = {
    ...userCollection,
    name: 'users',
    fields: userCollection.fields.filter((field) => field.name !== 'password'),
  };
  return (
    <ExtendCollectionsProvider collections={[collection]}>
      <RemoteSchemaComponent uid="nocobase-admin-profile-edit-form" noForm={true} scope={{ useCancelActionProps }} />
    </ExtendCollectionsProvider>
  );
};

const FilterAction = () => {
  const scCtx = useSchemaComponentContext();
  return (
    <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
      <SchemaComponent
        schema={{
          type: 'void',
          properties: {
            filter: {
              type: 'void',
              title: '{{ t("Filter") }}',
              'x-action': 'filter',
              'x-component': 'Filter.Action',
              'x-use-component-props': 'useFilterActionProps',
              'x-component-props': {
                icon: 'FilterOutlined',
              },
            },
          },
        }}
      />
    </SchemaComponentContext.Provider>
  );
};

const UsersManagementTab: React.FC = () => {
  const { t } = useUsersTranslation();
  const collectionManager = useCollectionManager();
  const usersCollection = useMemo(() => collectionManager?.getCollection('users'), [collectionManager]);

  if (!usersCollection) return <Spin />;

  return (
    <SchemaComponent
      schema={usersSchema}
      scope={{ t, useCancelActionProps, useSubmitActionProps, useEditFormProps }}
      components={{ PasswordField, ProfileEditForm, ProfileCreateForm, FilterAction }}
    />
  );
};
const UsersSettingsContext = createContext<any>({});

const UsersSettingsProvider = (props) => {
  const result = useRequest({
    url: 'users:getSystemSettings',
  });
  return <UsersSettingsContext.Provider value={result}>{props.children}</UsersSettingsContext.Provider>;
};

const UsersSettingsTab: React.FC = () => {
  const { t } = useUsersTranslation();
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
        await api.request({ url: 'users:updateSystemSettings', data: values, method: 'POST' });
        message.success(t('Saved successfully'));
        window.location.reload();
      },
    };
  };
  return (
    <SchemaComponent
      schema={usersSettingsSchema}
      scope={{ t, useFormBlockProps, useSubmitActionProps }}
      components={{ UsersSettingsProvider }}
    />
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
