/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Result } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BlockItemCard } from '../BlockItemCard';

export const BlockPlaceholder = () => {
  const { t } = useTranslation();
  return (
    <BlockItemCard>
      <Result status="403" subTitle={t('当前区块已被隐藏，你无法查看（该内容仅在激活 UI Editor 时显示）。')}></Result>
    </BlockItemCard>
  );
};
