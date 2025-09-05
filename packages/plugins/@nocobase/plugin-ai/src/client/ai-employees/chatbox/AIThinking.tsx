/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { Space, Spin } from 'antd';

export const AIThinking: React.FC<{ nickname: string }> = ({ nickname }) => {
  const t = useT();
  return (
    <Space>
      <Spin indicator={<LoadingOutlined spin />} />
      {t('AI is thinking', { nickname })}
    </Space>
  );
};
