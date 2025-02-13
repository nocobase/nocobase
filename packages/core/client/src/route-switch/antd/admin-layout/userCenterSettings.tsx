/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { UserCenterButton } from './UserCenterButton';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCurrentUserContext } from '../../../user/CurrentUserProvider';
import { SchemaSettingsItem, SchemaSettingsModalItem } from '../../../schema-settings';
import { useToken, useAPIClient, ActionContextProvider, DropdownVisibleContext, useSystemSettings } from '../../../';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { EditProfile } from '../../../user/EditProfile';
const NickName = (props) => {
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
