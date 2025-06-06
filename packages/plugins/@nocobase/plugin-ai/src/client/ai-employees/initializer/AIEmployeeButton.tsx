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
import { useParseTask } from '../chatbox/useParseTask';
import { useChatMessages } from '../chatbox/ChatMessagesProvider';
import { uid } from '@formily/shared';

export const AIEmployeeButton: React.FC<{
  username: string;
  taskDesc?: string;
  tasks: {
    title: string;
    message: {
      user?: string;
      system?: string;
      attachments?: any[];
    };
    autoSend?: boolean;
  }[];
}> = withDynamicSchemaProps(({ username, taskDesc, tasks }) => {
  const triggerTask = useChatBoxContext('triggerTask');
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaToolbarRender(fieldSchema);
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
      onClick={async () => triggerTask({ aiEmployee, tasks })}
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
