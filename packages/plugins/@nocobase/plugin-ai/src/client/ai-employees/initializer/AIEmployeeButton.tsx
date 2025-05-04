/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, Popover, Button, Spin } from 'antd';
import { avatars } from '../avatars';
import {
  SortableItem,
  useLocalVariables,
  useSchemaToolbarRender,
  useVariables,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import { useChatBoxContext } from '../chatbox/ChatBoxContext';
import { AIEmployee } from '../types';
import { ProfileCard } from '../ProfileCard';
import { useAIEmployeesContext } from '../AIEmployeesProvider';

async function replaceVariables(template, variables, localVariables = {}) {
  const regex = /\{\{\s*(.*?)\s*\}\}/g;
  let result = template;

  const matches = [...template.matchAll(regex)];

  if (matches.length === 0) {
    return template;
  }

  for (const match of matches) {
    const fullMatch = match[0];

    try {
      let value = await variables?.parseVariable(fullMatch, localVariables).then(({ value }) => value);

      if (typeof value !== 'string') {
        try {
          value = JSON.stringify(value);
        } catch (error) {
          console.error(error);
        }
      }

      if (value) {
        result = result.replace(fullMatch, value);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return result;
}

export const AIEmployeeButton: React.FC<{
  username: string;
  taskDesc?: string;
  autoSend?: boolean;
  message: {
    type: string;
    content: string;
  };
}> = withDynamicSchemaProps(({ username, taskDesc, message, autoSend }) => {
  const triggerShortcut = useChatBoxContext('triggerShortcut');
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaToolbarRender(fieldSchema);
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const {
    aiEmployeesMap,
    service: { loading },
  } = useAIEmployeesContext();
  const aiEmployee = aiEmployeesMap[username];

  if (!aiEmployee) {
    return null;
  }

  return (
    <SortableItem
      style={{
        position: 'relative',
        display: 'flex',
      }}
      onClick={async () => {
        let msg;
        if (message && message.content) {
          const content = await replaceVariables(message.content, variables, localVariables);
          msg = {
            type: message.type || 'text',
            content,
          };
        }
        triggerShortcut({
          aiEmployee,
          message: msg,
          autoSend,
        });
      }}
    >
      <Spin spinning={loading}>
        <Popover content={<ProfileCard taskDesc={taskDesc} aiEmployee={aiEmployee} />}>
          <Button
            shape="circle"
            style={{
              width: '36px',
              height: '36px',
            }}
          >
            {aiEmployee && <Avatar src={avatars(aiEmployee.avatar)} size={36} />}
          </Button>
        </Popover>
        {render()}
      </Spin>
    </SortableItem>
  );
});
