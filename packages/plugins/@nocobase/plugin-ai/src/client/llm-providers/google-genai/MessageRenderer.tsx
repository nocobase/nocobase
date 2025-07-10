/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Markdown } from '../../ai-employees/chatbox/markdown/Markdown';
import { ToolRenderer } from '../../ai-employees/chatbox/generative-ui/ToolRenderer';

export const MessageRenderer: React.FC<{
  msg: {
    messageId: string;
    content:
      | string
      | (
          | {
              type: 'text';
              text: string;
            }
          | any
        )[];
    tool_calls?: any[];
    metadata: {
      autoCallTool?: boolean;
    };
  };
}> = ({ msg }) => {
  let content = msg.content;
  if (Array.isArray(content)) {
    content = content.find((item) => item.type === 'text')?.text;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {typeof content === 'string' && (
        <Markdown
          message={{
            ...msg,
            // @ts-ignore
            content,
          }}
        />
      )}
      {msg.tool_calls?.length && <ToolRenderer tools={msg.tool_calls} messageId={msg.messageId} />}
    </div>
  );
};
