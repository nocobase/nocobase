/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Collapse, Tooltip } from 'antd';
import { useT } from '../../locale';
import { CaretRightOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useAPIClient, useGlobalTheme, usePlugin, useRequest, useToken } from '@nocobase/client';
import { useChatConversations } from './ChatConversationsProvider';
import { Schema } from '@formily/react';
import PluginAIClient from '../..';
import { useChatMessages } from './ChatMessagesProvider';
import { useChatBoxContext } from './ChatBoxContext';

const useDefaultAction = (messageId: string) => {
  const currentEmployee = useChatBoxContext('currentEmployee');
  const { currentConversation } = useChatConversations();
  const { callTool } = useChatMessages();
  return {
    callAction: () => {
      callTool({
        sessionId: currentConversation,
        messageId,
        aiEmployee: currentEmployee,
      });
    },
  };
};

const CallButton: React.FC<{
  messageId: string;
  name: string;
  args: any;
}> = ({ name, messageId, args }) => {
  const t = useT();
  const plugin = usePlugin('ai') as PluginAIClient;
  const tool = plugin.aiManager.tools.get(name);
  const useAction = tool?.useAction || useDefaultAction;
  const { callAction } = useAction(messageId);

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        callAction(args);
      }}
      variant="link"
      color="primary"
      size="small"
      icon={<CaretRightOutlined />}
    >
      {t('Call')}
    </Button>
  );
};

export const ToolCard: React.FC<{
  messageId: string;
  tools: {
    name: string;
    args: any;
  }[];
}> = ({ tools, messageId }) => {
  const t = useT();
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();
  const { currentConversation } = useChatConversations();
  const api = useAPIClient();

  const { data } = useRequest<{
    [name: string]: {
      title: string;
      description: string;
    };
  }>(() =>
    api
      .resource('aiConversations')
      .getTools({
        values: {
          sessionId: currentConversation,
          messageId,
        },
      })
      .then((res) => res?.data?.data),
  );

  const items = tools.map((tool) => ({
    key: tool.name,
    label: (
      <div
        style={{
          fontSize: token.fontSize,
        }}
      >
        {data?.[tool.name]?.title ? Schema.compile(data[tool.name].title, { t }) : tool.name}{' '}
        {data?.[tool.name]?.description && (
          <Tooltip title={Schema.compile(data[tool.name].description, { t })}>
            <QuestionCircleOutlined />
          </Tooltip>
        )}
      </div>
    ),
    extra: <CallButton messageId={messageId} name={tool.name} args={tool.args} />,
    children: (
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter {...rest} PreTag="div" language={match[1]} style={isDarkTheme ? dark : defaultStyle}>
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {'```json\n' + JSON.stringify(tool.args, null, 2) + '\n```'}
      </ReactMarkdown>
    ),
    style: {
      fontSize: token.fontSizeSM,
    },
  }));

  return <Collapse items={items} size="small" bordered={false} defaultActiveKey={[tools[0].name]} />;
};
