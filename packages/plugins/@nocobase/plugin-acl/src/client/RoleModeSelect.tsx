/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { message, Select, Space, theme, Tooltip } from 'antd';
import { useACLTranslation } from './locale';
import { useRequest } from 'ahooks';
import { useAPIClient, useCurrentRoleMode } from '@nocobase/client';
import React, { useState } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';

export const RoleModeSelect = () => {
  const { t } = useACLTranslation();
  const { token } = theme.useToken();
  const api = useAPIClient();
  const roleModeData = useCurrentRoleMode();
  const initialRoleMode = roleModeData?.roleMode || 'default';
  const [roleMode, setRoleMode] = useState(initialRoleMode);

  const { run: updateRoleMode } = useRequest(
    (roleMode) => api.resource('roles').setSystemRoleMode({ values: { roleMode } }),
    {
      manual: true,
      onSuccess: (_, params) => {
        setRoleMode(params[0]);
        message.success(t('Saved successfully'));
        window.location.reload();
      },
    },
  );

  const docLink = t(`Role mode doc`, { defaultValue: 'https://docs.nocobase.com/handbook/acl/manual' });

  return (
    <div>
      <Select
        value={roleMode}
        onChange={(value) => updateRoleMode(value)}
        options={[
          { value: 'default', label: t('Independent roles') },
          { value: 'allow-use-union', label: t('Allow roles union') },
          { value: 'only-use-union', label: t('Roles union only') },
        ]}
      />
      <a href={docLink} target="_blank" rel="noopener noreferrer">
        <QuestionCircleOutlined style={{ color: token.colorTextSecondary, cursor: 'pointer', marginLeft: 4 }} />
      </a>
    </div>
  );
};
