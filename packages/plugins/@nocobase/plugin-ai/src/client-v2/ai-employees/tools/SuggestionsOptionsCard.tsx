/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Button, Flex, Space, Spin, type ButtonProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { useT } from '../../locale';
import { useChat } from '../chatbox/hooks/useChat';
import { useChatBoxStore } from '../chatbox/stores/chat-box';
import { useChatConversationsStore } from '../chatbox/stores/chat-conversations';

type SuggestionsArgs = {
  options?: string[] | string;
  [key: string]: unknown;
};

type SuggestionsToolCall = ToolsUIProperties<SuggestionsArgs>['toolCall'] & {
  selectedSuggestion?: unknown;
};

const buttonBaseStyle: React.CSSProperties = {
  whiteSpace: 'normal',
  textAlign: 'left',
  height: 'auto',
  borderWidth: 1,
};

const parseOptions = (optionsInArgs: SuggestionsArgs['options']) => {
  if (Array.isArray(optionsInArgs)) {
    return optionsInArgs.filter((option): option is string => typeof option === 'string');
  }
  if (typeof optionsInArgs !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(optionsInArgs) as unknown;
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch (error) {
    console.log('fail to convert args from tool call suggestions', optionsInArgs);
    return [];
  }
};

const getEditableArgs = (args: SuggestionsArgs | undefined, option: string): Record<string, unknown> => {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return { option };
  }
  return { ...args, option };
};

export const SuggestionsOptionsCard: React.FC<ToolsUIProperties<SuggestionsArgs>> = ({
  messageId,
  toolCall,
  decisions,
}) => {
  const t = useT();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const responseLoading = chat.use.responseLoading();
  const messages = chat.use.messages();
  const readonly = useChatBoxStore.use.readonly();
  const [disabled, setDisabled] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const suggestionsToolCall = toolCall as SuggestionsToolCall;
  const generating = responseLoading && messages[messages.length - 1]?.content.messageId === messageId;
  const options = useMemo(() => parseOptions(toolCall.args?.options), [toolCall.args?.options]);

  const defaultButtonProps: ButtonProps = {
    style: buttonBaseStyle,
    color: 'default',
    variant: 'outlined',
  };
  const selectedButtonProps: ButtonProps = {
    style: {
      ...buttonBaseStyle,
      borderWidth: 2,
    },
    color: 'default',
    variant: 'dashed',
  };
  const getButtonProps = (option: string): ButtonProps =>
    suggestionsToolCall.selectedSuggestion === option || selected === option ? selectedButtonProps : defaultButtonProps;

  if (generating) {
    return (
      <Space>
        <Spin indicator={<LoadingOutlined spin />} size="small" /> {t('Generating...')}
      </Space>
    );
  }

  return (
    <Flex align="flex-start" gap="middle" wrap={true}>
      {options.map((option, index) => (
        <Button
          key={`${option}-${index}`}
          disabled={toolCall.invokeStatus !== 'interrupted' || disabled || readonly}
          {...getButtonProps(option)}
          onClick={() => {
            if (disabled) {
              return;
            }
            setDisabled(true);
            setSelected(option);
            decisions.edit(getEditableArgs(toolCall.args, option));
          }}
        >
          <div>{option}</div>
        </Button>
      ))}
    </Flex>
  );
};

SuggestionsOptionsCard.displayName = 'SuggestionsOptionsCard';
