/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { SchemaSettingsItem, useNavigateNoUpdate, useAPIClient, useCurrentUserContext } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const SignOut = () => {
  const { t } = useTranslation();
  const navigate = useNavigateNoUpdate();
  const api = useAPIClient();
  const ctx = useCurrentUserContext();
  return (
    <SchemaSettingsItem
      title="signOut"
      eventKey="signOut"
      onClick={async () => {
        const { data } = await api.auth.signOut();
        if (data?.data?.redirect) {
          window.location.href = data.data.redirect;
        } else {
          navigate(`/signin?redirect=${encodeURIComponent('')}`);
        }
        ctx.mutate(null);
      }}
    >
      {t('Sign out')}
    </SchemaSettingsItem>
  );
};
