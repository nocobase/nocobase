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

  const helpText = t(`
        允许切换合并角色：可切换至“全部权限”角色，并拥有多个角色的最大权限。
        仅使用合并角色：当切换至此模式，默认使用合并角色，且不可切换其他角色。
    `);

  return (
    <div>
      <Select
        value={roleMode}
        onChange={(value) => updateRoleMode(value)}
        options={[
          { value: 'default', label: t('Independent Roles') },
          { value: 'allow-use-union', label: t('Allow Roles Union') },
          { value: 'only-use-union', label: t('Roles Union Only') },
        ]}
      />
      <Tooltip title={helpText} overlayInnerStyle={{ fontSize: '12px' }}>
        <QuestionCircleOutlined style={{ color: token.colorTextSecondary, cursor: 'pointer', marginLeft: 4 }} />
      </Tooltip>
    </div>
  );
};
