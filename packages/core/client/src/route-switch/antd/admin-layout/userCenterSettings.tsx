/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { App } from 'antd';
import { UserCenterButton } from './UserCenterButton';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCurrentUserContext } from '../../../user/CurrentUserProvider';
import { SchemaSettingsItem } from '../../../schema-settings';
import { useToken, useAPIClient } from '../../../';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { EditProfile } from '../../../user/EditProfile';
import { ChangePassword } from '../../../user/ChangePassword';
import { SwitchRole } from '../../../user/SwitchRole';
import { LanguageSettings } from '../../../user/LanguageSettings';

const NickName = () => {
  const { data } = useCurrentUserContext();
  const { token } = useToken();
  return (
    <SchemaSettingsItem disabled={true} eventKey="nickname" title="nickname">
      <span aria-disabled="false" style={{ cursor: 'text', color: token.colorTextDescription }}>
        {data?.data?.nickname || data?.data?.username || data?.data?.email}
      </span>
    </SchemaSettingsItem>
  );
};

const SignOut = () => {
  const { t } = useTranslation();
  const navigate = useNavigateNoUpdate();
  const api = useAPIClient();
  return (
    <SchemaSettingsItem
      title="signOut"
      disabled={true}
      eventKey="signOut"
      onClick={async () => {
        const { data } = await api.auth.signOut();
        if (data?.data?.redirect) {
          window.location.href = data.data.redirect;
        } else {
          navigate(`/signin?redirect=${encodeURIComponent('')}`);
        }
      }}
    >
      {t('Sign out')}
    </SchemaSettingsItem>
  );
};

const ClearCache = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  return (
    <SchemaSettingsItem
      eventKey="cache"
      title="cache"
      onClick={async () => {
        await api.resource('app').clearCache();
        window.location.reload();
      }}
    >
      {t('Clear cache')}
    </SchemaSettingsItem>
  );
};

const RestartApplication = () => {
  const { t } = useTranslation();
  const api = useAPIClient();
  const { modal } = App.useApp();
  return (
    <SchemaSettingsItem
      eventKey="restartApplication"
      title="restartApplication"
      onClick={async () => {
        modal.confirm({
          title: t('Restart application'),
          // content: t('The will interrupt service, it may take a few seconds to restart. Are you sure to continue?'),
          okText: t('Restart'),
          okButtonProps: {
            danger: true,
          },
          onOk: async () => {
            await api.resource('app').restart();
          },
        });
      }}
    >
      {t('Restart application')}
    </SchemaSettingsItem>
  );
};
const userCenterSettings = new SchemaSettings({
  name: 'userCenterSettings',
  Component: UserCenterButton,
  items: [
    {
      name: 'nickname',
      Component: NickName,
      sort: 10,
    },
    {
      name: 'divider1',
      type: 'divider',
      sort: 30,
    },
    {
      name: 'editProfile',
      Component: EditProfile,
      sort: 50,
    },
    {
      name: 'changePassword',
      Component: ChangePassword,
      sort: 100,
    },
    {
      name: 'divider3',
      type: 'divider',
      sort: 200,
    },
    {
      name: 'switchRole',
      Component: SwitchRole,
      sort: 300,
    },
    {
      name: 'langue',
      Component: LanguageSettings,
      sort: 350,
    },
    {
      name: 'divider4',
      type: 'divider',
      sort: 400,
    },
    {
      name: 'cache',
      Component: ClearCache,
      sort: 500,
    },
    {
      name: 'restartApplication',
      Component: RestartApplication,
      sort: 510,
    },
    {
      name: 'divider2',
      type: 'divider',
      sort: 900,
    },
    {
      name: 'signOut',
      sort: 1000,
      Component: SignOut,
    },
  ],
});

export { userCenterSettings };
