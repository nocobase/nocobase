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
  useCollectValuesToSubmit,
  useCollectionManager,
  useCurrentUserContext,
  useCurrentUserSettingsMenu,
  useSystemSettings,
} from '@nocobase/client';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { MenuProps } from 'antd';
import { useUsersTranslation } from './locale';
import { uid } from '@formily/shared';
import { useForm, useFieldSchema, useField } from '@formily/react';

const useUpdateProfileActionProps = () => {
  const ctx = useCurrentUserContext();
  const { setVisible } = useActionContext();
  const form = useForm();
  const api = useAPIClient();
  const actionSchema = useFieldSchema();
  const actionField = useField();
  const collectValues = useCollectValuesToSubmit();

  return {
    type: 'primary',
    htmlType: 'submit',
    async onClick() {
      const { triggerWorkflows, skipValidator } = actionSchema?.['x-action-settings'] ?? {};
      if (!skipValidator) {
        await form.submit();
      }
      const values = await collectValues();
      actionField.data = actionField.data || {};
      actionField.data.loading = true;
      try {
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
        await form.reset();
        actionField.data.loading = false;
        setVisible(false);
      } catch (error) {
        actionField.data.loading = false;
      }
    },
  };
};

const ProfileEditForm = () => {
  const cm = useCollectionManager();
  const userCollection = cm.getCollection('users');
  const { data } = useCurrentUserContext();
  const collection = useMemo(
    () => ({
      ...userCollection,
      name: 'users',
      fields: userCollection.fields.filter((field) => !['password', 'roles'].includes(field.name)),
    }),
    [userCollection],
  );
  return (
    <ExtendCollectionsProvider collections={[collection]}>
      <RemoteSchemaComponent
        uid="nocobase-user-profile-edit-form"
        noForm={true}
        scope={{
          useUpdateProfileActionProps,
          currentUserId: data.data?.id,
        }}
      />
    </ExtendCollectionsProvider>
  );
};

export const useEditProfile = () => {
  const ctx = useContext(DropdownVisibleContext);
  const [visible, setVisible] = useState(false);
  const { t } = useUsersTranslation();
  const { data } = useSystemSettings() || {};
  const { enableEditProfile } = data?.data || {};
  const result = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'profile',
      eventKey: 'EditProfile',
      onClick: () => {
        setVisible(true);
        ctx?.setVisible(false);
      },
      label: (
        <div>
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
      ),
    };
  }, [visible]);
  if (enableEditProfile === false) {
    return null;
  }
  return result;
};

// Adding a user settings menu here causes the drawer to fail to open.
// This provider will not be used for now.
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
