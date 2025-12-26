/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { CSSProperties, useState } from 'react';
import { ToolCall } from '../../types';
import { useChatBoxStore } from '../../chatbox/stores/chat-box';
import { useChatConversationsStore } from '../../chatbox/stores/chat-conversations';
import { useChatMessageActions } from '../../chatbox/hooks/useChatMessageActions';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { Button, Flex, Spin, Space, ButtonProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useT } from '../../../locale';
import { CheckCircleOutlined } from '@ant-design/icons';

export const SuggestionsOptions: React.FC<{
  messageId: string;
  tool: ToolCall<{
    options: string[];
  }>;
}> = ({ messageId, tool }) => {
  const t = useT();
  const responseLoading = useChatMessagesStore.use.responseLoading();
  const messages = useChatMessagesStore.use.messages();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const { callTool } = useChatMessageActions();
  const [disabled, setDisabled] = useState(false);
  const [selected, setSelected] = useState(null);
  const generating = responseLoading && messages[length - 1]?.content.messageId === messageId;

  const btnStyle: CSSProperties = { whiteSpace: 'normal', textAlign: 'left', height: 'auto', borderWidth: 1 };
  const defaultBtnProps: ButtonProps = {
    style: {
      ...btnStyle,
    },
    color: 'default',
    variant: 'outlined',
  };
  const selectedBtnProps: ButtonProps = {
    style: {
      ...btnStyle,
      borderWidth: 2,
    },
    color: 'default',
    variant: 'dashed',
  };
  const btnProps = (option: string): ButtonProps =>
    tool.selectedSuggestion === option || selected === option ? selectedBtnProps : defaultBtnProps;

  return generating ? (
    <Space>
      <Spin indicator={<LoadingOutlined spin />} size="small" /> {t('Generating...')}
    </Space>
  ) : (
    <Flex align="flex-start" gap="middle" wrap={true}>
      {tool.args?.options?.map((option, index) => (
        <Button
          key={index}
          disabled={tool.invokeStatus !== 'init' || disabled}
          {...btnProps(option)}
          onClick={() => {
            if (disabled) {
              return;
            }
            setDisabled(true);
            setSelected(option);
            callTool({
              sessionId: currentConversation,
              aiEmployee: currentEmployee,
              messageId: messageId,
              args: { option },
            });
          }}
        >
          <div>{option}</div>
        </Button>
      ))}
    </Flex>
  );
};
