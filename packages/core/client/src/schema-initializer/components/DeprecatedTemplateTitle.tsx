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
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Space, Tooltip } from 'antd';

export const DeprecatedTemplateTitle = () => {
  const { t } = useTranslation();
  return (
    <Space>
      {t('Deprecated')}
      <Tooltip
        title={t('The following old template features have been deprecated and will be removed in next version.')}
      >
        <QuestionCircleOutlined />
      </Tooltip>
    </Space>
  );
};

export const DeprecatedTemplateTitleElement = <DeprecatedTemplateTitle />;
