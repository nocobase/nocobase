/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../constants';

function useT() {
  return useTranslation(NAMESPACE).t;
}

const LightExtensionHomePage: React.FC = () => {
  const t = useT();

  return (
    <Flex vertical gap={24} style={{ padding: 24 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        {t('Light extensions')}
      </Typography.Title>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No light extensions yet')} style={{ marginTop: 48 }}>
        <Button type="primary" icon={<PlusOutlined />}>
          {t('Create light extension')}
        </Button>
      </Empty>
    </Flex>
  );
};

export default LightExtensionHomePage;
