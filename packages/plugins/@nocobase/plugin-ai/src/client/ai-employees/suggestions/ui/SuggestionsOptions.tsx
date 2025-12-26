/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { ToolCall } from '../../types';
import { useChatBoxStore } from '../../chatbox/stores/chat-box';
import { useChatConversationsStore } from '../../chatbox/stores/chat-conversations';
import { useChatMessageActions } from '../../chatbox/hooks/useChatMessageActions';
import { Button, Flex } from 'antd';

export const SuggestionsOptions: React.FC<{
  messageId: string;
  tool: ToolCall<{
    options: string[];
  }>;
}> = ({ messageId, tool }) => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const { callTool } = useChatMessageActions();
  const [disabled, setDisabled] = useState(false);
  return (
    <Flex align="flex-start" gap="middle" wrap={true}>
      {tool.args?.options?.map((option, index) => (
        <Button
          key={index}
          disabled={tool.invokeStatus !== 'init' || disabled}
          style={{
            whiteSpace: 'normal',
            textAlign: 'left',
            height: 'auto',
          }}
          variant="outlined"
          onClick={async () => {
            await callTool({
              sessionId: currentConversation,
              aiEmployee: currentEmployee,
              messageId: messageId,
              args: { option },
            });
            setDisabled(true);
          }}
        >
          <div>{option}</div>
        </Button>
      ))}
    </Flex>
  );
};
