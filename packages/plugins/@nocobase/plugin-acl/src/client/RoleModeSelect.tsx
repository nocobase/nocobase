/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useAPIClient, useCurrentRoleMode } from '@nocobase/client';
import { useRequest } from 'ahooks';
import { Flex, message, Select, theme, Tooltip } from 'antd';
import React, { useState } from 'react';
import { useACLTranslation } from './locale';

export const RoleModeSelect = () => {
  const { t } = useACLTranslation();
  const api = useAPIClient();
  const roleModeData = useCurrentRoleMode();
  const initialRoleMode = roleModeData || 'default';
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

  return (
    <div>
      <Select
        value={roleMode}
        onChange={(value) => updateRoleMode(value)}
        options={[
          {
            value: 'default',
            label: t('Independent roles'),
            desc: t('Do not use role union. Users need to switch between their roles individually.'),
          },
          {
            value: 'allow-use-union',
            label: t('Allow roles union'),
            desc: t(
              'Allow users to use role union, which means they can use permissions from all their roles simultaneously, or switch between individual roles.',
            ),
          },
          {
            value: 'only-use-union',
            label: t('Roles union only'),
            desc: t('Force users to use only role union. They cannot switch between individual roles.'),
          },
        ]}
        optionRender={(option) => (
          <Tooltip placement="right" title={<div>{option.data.desc}</div>}>
            <Flex justify="space-between">
              <span style={{ display: 'inline-flex', paddingRight: 8 }}>{option.data.label}</span>
            </Flex>
          </Tooltip>
        )}
      />
    </div>
  );
};
