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
import { useChatMessages } from './ChatMessagesProvider';
import { Upload } from './Upload';
import { AddContextButton } from './AddContextButton';

export const SenderFooter: React.FC<{
  components: any;
}> = ({ components }) => {
  const { SendButton, LoadingButton } = components;
  const { responseLoading: loading } = useChatMessages();

  return (
    <Flex justify="space-between" align="center">
      <Flex gap="small" align="center">
        <AddContextButton />
        <Divider type="vertical" />
        <Upload />
      </Flex>
      <Flex align="center">
        {loading ? <LoadingButton type="default" /> : <SendButton type="primary" disabled={false} />}
      </Flex>
    </Flex>
  );
};
