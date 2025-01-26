/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { MenuProps } from 'antd';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionContextProvider,
  DropdownVisibleContext,
  ExtendCollectionsProvider,
  RemoteSchemaComponent,
  SchemaComponent,
  useActionContext,
  useCollectValuesToSubmit,
  useCollectionManager,
  useCurrentUserContext,
  useSystemSettings,
} from '../';
import { useAPIClient } from '../api-client';

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

const useEditProfileFormBlockDecoratorProps = () => {
  const { data } = useCurrentUserContext();
  return {
    filterByTk: data.data?.id,
  };
};

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
    },
  };
};

const ProfileEditForm = () => {
  const ctx = useContext(DropdownVisibleContext);
  const cm = useCollectionManager();
  const userCollection = cm.getCollection('users');
  const collection = useMemo(
    () => ({
      ...userCollection,
      name: 'users',
      fields: userCollection.fields.filter((field) => !['password', 'roles'].includes(field.name)),
    }),
    [userCollection],
  );
  useEffect(() => {
    ctx?.setVisible(false);
  }, [ctx]);
  return (
    <ExtendCollectionsProvider collections={[collection]}>
      <RemoteSchemaComponent
        uid="nocobase-user-profile-edit-form"
        noForm={true}
        scope={{
          useUpdateProfileActionProps,
          useEditFormBlockDecoratorProps: useEditProfileFormBlockDecoratorProps,
          useCancelActionProps,
        }}
      />
    </ExtendCollectionsProvider>
  );
};

export const useEditProfile = () => {
  const ctx = useContext(DropdownVisibleContext);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  const { data } = useSystemSettings() || {};
  const { enableEditProfile } = data?.data || {};
  const result = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'profile',
      eventKey: 'EditProfile',
      onClick: () => {
        ctx?.setVisible(false);
        setVisible(true);
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
                        zIndex: 2000,
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
