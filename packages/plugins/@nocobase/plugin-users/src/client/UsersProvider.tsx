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
  RemoteSchemaComponent,
  SchemaComponent,
  useCurrentUserSettingsMenu,
  useSystemSettings,
} from '@nocobase/client';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { MenuProps } from 'antd';
import { useUsersTranslation } from './locale';
import { uid } from '@formily/shared';

const ProfileEditForm = () => {
  return (
    <RemoteSchemaComponent
      uid="nocobase-user-profile-edit-form"
      noForm={true}
      scope={{ useEditFormBlockDecoratorProps: () => ({}) }}
    />
  );
};

const useEditProfile = () => {
  const { t } = useUsersTranslation();
  const [visible, setVisible] = useState(false);
  const ctx = useContext(DropdownVisibleContext);
  const profileItem = useMemo<MenuProps['items'][0]>(() => {
    return {
      key: 'profile2',
      eventKey: 'EditProfile2',
      onClick: () => {
        setVisible(true);
        ctx?.setVisible(false);
      },
      label: (
        <>
          {t('Edit profile2')}
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
                        zIndex: 10000,
                      },
                      type: 'void',
                      title: '{{t("Edit profile")}}',
                      properties: {
                        // form: {
                        //   type: 'void',
                        //   'x-component': 'ProfileEditForm',
                        // },
                      },
                    },
                  },
                }}
              />
            </div>
          </ActionContextProvider>
        </>
      ),
    };
  }, [visible]);
  return profileItem;
};

export const UsersProvider: React.FC = (props) => {
  const { addMenuItem } = useCurrentUserSettingsMenu();
  const { data } = useSystemSettings();
  const { enableEditProfile } = data?.data || {};
  const profileItem = useEditProfile();

  useEffect(() => {
    addMenuItem(profileItem, { after: 'divider_1' });
  }, [addMenuItem, enableEditProfile, profileItem]);
  return <>{props.children}</>;
};
