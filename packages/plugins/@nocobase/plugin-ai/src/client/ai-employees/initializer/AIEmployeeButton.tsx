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
  useBlockRequestContext,
  useContextVariable,
  useLocalVariables,
  useSchemaToolbarRender,
  useVariables,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import { useChatBoxContext } from '../chatbox/ChatBoxContext';
import { ProfileCard } from '../ProfileCard';
import { useAIEmployeesContext } from '../AIEmployeesProvider';

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
  const { field } = useBlockRequestContext();
  const { ctx } = useContextVariable();
  const selectedRecord = field?.data?.selectedRowData ? field?.data?.selectedRowData : ctx;
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const triggerTask = useChatBoxContext('triggerTask');
  const setTaskVariables = useChatBoxContext('setTaskVariables');
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
      onClick={async () => {
        const local = [...localVariables, { name: '$nSelectedRecord', ctx: selectedRecord }];
        setTaskVariables({
          variables,
          localVariables: local,
        });
        triggerTask({ aiEmployee, tasks, variables, localVariables: local });
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
