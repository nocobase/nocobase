/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Collapse, Flex, List, Typography } from 'antd';
import { useT } from '../../../locale';
import type { Message } from '../../types';
import { AttachmentList } from './Attachments';
import { Markdown } from './Markdown';
import { ToolCard } from './ToolCard';

const { Link, Paragraph, Text } = Typography;

export const MessageContent: React.FC<{
  message: Message;
}> = ({ message }) => {
  const t = useT();
  const content = message.content;
  const text = stringifyContent(content?.content);

  return (
    <Flex vertical gap="small">
      {content?.reasoning?.content ? (
        <Collapse
          size="small"
          ghost
          items={[
            {
              key: 'reasoning',
              label: t('Reasoning'),
              children: <Paragraph>{content.reasoning.content}</Paragraph>,
            },
          ]}
        />
      ) : null}
      {text ? <Markdown>{text}</Markdown> : null}
      <AttachmentList attachments={content?.attachments} />
      <ToolCard toolCalls={content?.tool_calls} messageId={content?.messageId} />
      {Array.isArray(content?.reference) && content.reference.length ? (
        <List
          header={<Text type="secondary">{t('References')}</Text>}
          dataSource={content.reference}
          renderItem={(item) => (
            <List.Item>
              <Link href={item.url} target="_blank" rel="noreferrer">
                {item.title || item.url}
              </Link>
            </List.Item>
          )}
        />
      ) : null}
    </Flex>
  );
};

function stringifyContent(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }
  if (content == null) {
    return '';
  }
  try {
    return JSON.stringify(content, null, 2);
  } catch (error) {
    console.error(error);
    return String(content);
  }
}
