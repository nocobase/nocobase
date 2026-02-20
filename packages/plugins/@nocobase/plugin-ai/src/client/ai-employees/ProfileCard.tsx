/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, Divider, Typography, Flex, Tag } from 'antd';
import { useToken } from '@nocobase/client';
import { AIEmployee, Task } from './types';
import { avatars } from './avatars';
import { useChatBoxActions } from './chatbox/hooks/useChatBoxActions';

export const ProfileCard: React.FC<{
  aiEmployee: AIEmployee;
  tasks?: Task[];
}> = ({ aiEmployee, tasks }) => {
  const { token } = useToken();
  tasks = tasks?.filter((task) => task.title) || [];

  const { triggerTask } = useChatBoxActions();

  if (!aiEmployee) {
    return null;
  }

  return (
    <div
      style={{
        width: '260px',
        padding: '4px 8px',
      }}
    >
      <Flex align="center" gap={10}>
        <Avatar
          src={avatars(aiEmployee.avatar)}
          size={40}
          style={{
            flexShrink: 0,
          }}
        />
        <Flex vertical>
          <span
            style={{
              fontSize: token.fontSize,
              color: token.colorText,
              lineHeight: 1.4,
            }}
          >
            {aiEmployee.nickname}
          </span>
          <span
            style={{
              fontSize: token.fontSizeSM,
              color: token.colorTextTertiary,
              lineHeight: 1.4,
            }}
          >
            {aiEmployee.position}
          </span>
        </Flex>
      </Flex>
      {aiEmployee.bio ? (
        <>
          <Divider style={{ margin: '8px 0' }} />
          <Typography.Paragraph
            style={{
              marginBottom: 0,
              fontSize: token.fontSizeSM,
              color: token.colorTextSecondary,
              lineHeight: 1.6,
            }}
          >
            {aiEmployee.bio}
          </Typography.Paragraph>
        </>
      ) : null}
      {tasks.length ? (
        <Flex
          gap="4px 4px"
          wrap={true}
          style={{
            marginTop: '8px',
          }}
        >
          {tasks.map((task, index) => (
            <Tag
              key={index}
              style={{
                cursor: 'pointer',
                maxWidth: '100%',
                whiteSpace: 'normal',
              }}
              onClick={() =>
                triggerTask({
                  aiEmployee,
                  tasks: [task],
                })
              }
            >
              {task.title}
            </Tag>
          ))}
        </Flex>
      ) : null}
    </div>
  );
};
