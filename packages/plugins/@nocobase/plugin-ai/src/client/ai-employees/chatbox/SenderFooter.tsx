/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Divider, Flex } from 'antd';
import { useChatBoxContext } from './ChatBoxContext';
import { FieldSelector } from './FieldSelector';
import { useT } from '../../locale';

export const SenderFooter: React.FC<{
  components: any;
}> = ({ components }) => {
  const t = useT();
  const { SendButton, LoadingButton } = components;
  const { responseLoading: loading } = useChatBoxContext('responseLoading');

  return (
    <Flex justify="space-between" align="center">
      <Flex gap="small" align="center">
        <FieldSelector />
        <Divider type="vertical" />
      </Flex>
      <Flex align="center">
        {loading ? <LoadingButton type="default" /> : <SendButton type="primary" disabled={false} />}
      </Flex>
    </Flex>
  );
};
