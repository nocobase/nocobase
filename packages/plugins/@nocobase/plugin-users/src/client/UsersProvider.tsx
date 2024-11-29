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
  DropdownVisibleContext,
  ExtendCollectionsProvider,
  RemoteSchemaComponent,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useCollectionManager,
  useCurrentUserContext,
  useCurrentUserSettingsMenu,
  useSystemSettings,
} from '@nocobase/client';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { MenuProps } from 'antd';
import { useUsersTranslation } from './locale';
import { uid } from '@formily/shared';
import { createForm } from '@formily/core';
import { useForm, useFieldSchema } from '@formily/react';

const useProfileFormProps = () => {
  const { data } = useCurrentUserContext();
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          ...data.data,
        },
      }),
    [data],
  );

  return {
    form,
  };
};

const useUpdateProfileActionProps = () => {
  const ctx = useCurrentUserContext();
  const { setVisible } = useActionContext();
  const form = useForm();
  const api = useAPIClient();
  const actionSchema = useFieldSchema();

  return {
    type: 'primary',
    htmlType: 'submit',
    async onClick() {
      const { triggerWorkflows } = actionSchema?.['x-action-settings'] ?? {};
      const values = await form.submit<any>();
      setVisible(false);
      await api.resource('users').updateProfile({
        values,
        triggerWorkflows: triggerWorkflows?.length
          ? triggerWorkflows.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
          : undefined,
      });
      ctx.mutate({
        data: {
          ...ctx?.data?.data,
          ...values,
        },
      });
    },
  };
};

const ProfileEditForm = () => {
  const cm = useCollectionManager();
  const userCollection = cm.getCollection('users');
  const collection = {
    ...userCollection,
    name: 'users',
    fields: userCollection.fields.filter((field) => !['password', 'roles'].includes(field.name)),
  };
  return (
    <ExtendCollectionsProvider collections={[collection]}>
      <RemoteSchemaComponent
        uid="nocobase-user-profile-edit-form"
        noForm={true}
        scope={{
          useProfileFormProps,
          useUpdateProfileActionProps,
        }}
      />
    </ExtendCollectionsProvider>
  );
};

const EditProfile = () => {
  const { t } = useUsersTranslation();
  const [visible, setVisible] = useState(false);
  const ctx = useContext(DropdownVisibleContext);
  return (
    <div
      onClick={() => {
        setVisible(true);
        ctx?.setVisible(false);
      }}
    >
      {t('Edit profile')}
      <ActionContextProvider value={{ visible, setVisible }}>
        <div onClick={(e) => e.stopPropagation()}>
          <SchemaComponent
            components={{ ProfileEditForm }}
            schema={{
              type: 'object',
              properties: {
                [uid()]: {
                  'x-component': 'Action.Drawer',
                  'x-component-props': {
                    // zIndex: 10000,
                  },
                  type: 'void',
                  title: '{{t("Edit profile")}}',
                  properties: {
                    form: {
                      type: 'void',
                      'x-component': 'ProfileEditForm',
                    },
                  },
                },
              },
            }}
          />
        </div>
      </ActionContextProvider>
    </div>
  );
};

const useEditProfile = () => {
  const profileItem = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'profile',
      eventKey: 'EditProfile',
      label: <EditProfile />,
    };
  }, []);
  return profileItem;
};

export const UsersProvider: React.FC = (props) => {
  const { addMenuItem } = useCurrentUserSettingsMenu();
  const profileItem = useEditProfile();
  const { data } = useSystemSettings();
  const { enableEditProfile } = data?.data || {};

  useEffect(() => {
    if (enableEditProfile === false) {
      return;
    }
    addMenuItem(profileItem, { after: 'divider_1' });
  }, [addMenuItem, profileItem, enableEditProfile]);
  return <>{props.children}</>;
};
