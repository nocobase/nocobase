/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { CSSProperties, useState } from 'react';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { Button, Flex, Spin, Space, ButtonProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useT } from '../../../locale';
import { ToolsUIProperties } from '@nocobase/client';

export const SuggestionsOptions: React.FC<
  ToolsUIProperties<{
    options: string[];
  }>
> = ({ messageId, toolCall, decisions }) => {
  const t = useT();
  const responseLoading = useChatMessagesStore.use.responseLoading();
  const messages = useChatMessagesStore.use.messages();
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
    toolCall.selectedSuggestion === option || selected === option ? selectedBtnProps : defaultBtnProps;

  const optionsInArgs: unknown = toolCall.args?.options ?? [];
  let options = [];
  if (typeof optionsInArgs === 'string') {
    try {
      options = JSON.parse(optionsInArgs);
    } catch (e) {
      console.log(`fail to convert args from tool call ${toolCall.name}`, toolCall.args);
    }
  } else {
    options = optionsInArgs as string[];
  }

  return generating ? (
    <Space>
      <Spin indicator={<LoadingOutlined spin />} size="small" /> {t('Generating...')}
    </Space>
  ) : (
    <Flex align="flex-start" gap="middle" wrap={true}>
      {options.map((option, index) => (
        <Button
          key={index}
          disabled={toolCall.invokeStatus !== 'interrupted' || disabled}
          {...btnProps(option)}
          onClick={() => {
            if (disabled) {
              return;
            }
            setDisabled(true);
            setSelected(option);
            decisions.edit({ ...(toolCall.args ?? {}), option });
          }}
        >
          <div>{option}</div>
        </Button>
      ))}
    </Flex>
  );
};
