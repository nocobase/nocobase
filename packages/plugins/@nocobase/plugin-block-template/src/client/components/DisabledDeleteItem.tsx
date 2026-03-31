/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsDivider, SchemaSettingsItem } from '@nocobase/client';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip, Space } from 'antd';
import React from 'react';
import { useT } from '../locale';

export const DisabledDeleteItem = () => {
  const t = useT();
  return (
    <>
      <SchemaSettingsDivider />
      <SchemaSettingsItem disabled={true} title={t('Delete')}>
        <Space>
          {t('Delete')}
          <Tooltip title={t('This is part of a template, deletion is not allowed')}>
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      </SchemaSettingsItem>
    </>
  );
};
