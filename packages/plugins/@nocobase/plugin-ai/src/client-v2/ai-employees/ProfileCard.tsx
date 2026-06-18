/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, Divider, Flex, Tag, Typography, theme } from 'antd';
import { avatars } from './avatars';
import type { AIEmployee, Task } from './types';

export const AIEmployeeProfileCard: React.FC<{
  aiEmployee: AIEmployee;
  tasks?: Task[];
  onTaskClick?: (task: Task) => void;
  taskLoadingTitle?: string;
  loadingTaskTitle?: string;
}> = ({ aiEmployee, tasks, onTaskClick, taskLoadingTitle, loadingTaskTitle }) => {
  const { token } = theme.useToken();
  const visibleTasks = tasks?.filter((task) => task.title) || [];

  if (!aiEmployee) {
    return null;
  }

  return (
    <div style={{ width: token.screenXS, paddingBlock: token.paddingXXS, paddingInline: token.paddingSM }}>
      <Flex align="center" gap="small">
        <Avatar
          src={aiEmployee.avatar ? avatars(aiEmployee.avatar) : undefined}
          size={token.controlHeightLG}
          style={{ flexShrink: 0 }}
        />
        <Flex vertical>
          <span style={{ fontSize: token.fontSize, color: token.colorText, lineHeight: token.lineHeight }}>
            {aiEmployee.nickname}
          </span>
          <span style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary, lineHeight: token.lineHeight }}>
            {aiEmployee.position}
          </span>
        </Flex>
      </Flex>
      {aiEmployee.bio ? (
        <>
          <Divider style={{ marginBlock: token.marginXS }} />
          <Typography.Paragraph
            style={{
              marginBottom: 0,
              fontSize: token.fontSizeSM,
              color: token.colorTextSecondary,
              lineHeight: token.lineHeight,
            }}
          >
            {aiEmployee.bio}
          </Typography.Paragraph>
        </>
      ) : null}
      {visibleTasks.length ? (
        <Flex gap="small" wrap={true} style={{ marginTop: token.marginXS }}>
          {visibleTasks.map((task, index) => (
            <Tag
              key={index}
              style={{
                cursor: onTaskClick && !loadingTaskTitle ? 'pointer' : 'default',
                maxWidth: '100%',
                whiteSpace: 'normal',
              }}
              onClick={() => {
                if (!loadingTaskTitle) {
                  onTaskClick?.(task);
                }
              }}
            >
              {loadingTaskTitle === task.title && taskLoadingTitle ? taskLoadingTitle : task.title}
            </Tag>
          ))}
        </Flex>
      ) : null}
    </div>
  );
};
