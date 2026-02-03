/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, Divider, Typography, Flex, Button } from 'antd';
import { useToken } from '@nocobase/client';
import { AIEmployee, Task } from './types';
import { avatars } from './avatars';
import { useT } from '../locale';
import { useChatBoxActions } from './chatbox/hooks/useChatBoxActions';

export const ProfileCard: React.FC<{
  aiEmployee: AIEmployee;
  tasks?: Task[];
  variant?: 'full' | 'simple';
}> = ({ aiEmployee, tasks, variant = 'full' }) => {
  const { token } = useToken();
  const t = useT();
  tasks = tasks?.filter((task) => task.title) || [];

  const { triggerTask } = useChatBoxActions();

  if (variant === 'simple') {
    if (!aiEmployee) {
      return null;
    }
    return (
      <div
        style={{
          width: '240px',
          padding: '4px 8px',
        }}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={10}>
            <Avatar
              src={avatars(aiEmployee.avatar)}
              size={40}
              style={{
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: token.fontSize,
                color: token.colorText,
              }}
            >
              {aiEmployee.nickname}
            </span>
          </Flex>
          <span
            style={{
              fontSize: token.fontSize,
              color: '#999',
            }}
          >
            {aiEmployee.position}
          </span>
        </Flex>
        {aiEmployee.bio ? (
          <>
            <Divider style={{ margin: '4px 0' }} />
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
      </div>
    );
  }

  return (
    <div
      style={{
        width: '300px',
        padding: '8px',
      }}
    >
      {aiEmployee ? (
        <>
          <div
            style={{
              width: '100%',
              textAlign: 'center',
            }}
          >
            <Avatar
              src={avatars(aiEmployee.avatar)}
              size={60}
              style={{
                boxShadow: `0px 0px 2px ${token.colorBorder}`,
              }}
            />
            <div
              style={{
                fontSize: token.fontSizeLG,
                fontWeight: token.fontWeightStrong,
                marginTop: '8px',
              }}
            >
              {aiEmployee.nickname}
            </div>
            <div
              style={{
                fontSize: token.fontSize,
                color: token.colorTextSecondary,
                marginBottom: '8px',
              }}
            >
              {aiEmployee.position}
            </div>
          </div>
          <Divider
            orientation="left"
            plain
            style={{
              fontStyle: 'italic',
            }}
          >
            {t('Bio')}
          </Divider>
          <Typography.Paragraph>{aiEmployee.bio}</Typography.Paragraph>
          {tasks.length ? (
            <>
              <Divider
                orientation="left"
                plain
                style={{
                  fontStyle: 'italic',
                }}
              >
                {t('Tasks')}
              </Divider>
              <Flex align="flex-start" gap="middle" wrap={true}>
                {tasks.map((task, index) => (
                  <Button
                    key={index}
                    style={{
                      whiteSpace: 'normal',
                      textAlign: 'left',
                      height: 'auto',
                    }}
                    variant="outlined"
                    onClick={() =>
                      triggerTask({
                        aiEmployee,
                        tasks: [task],
                      })
                    }
                  >
                    <div>{task.title || `${t('Task')} ${index + 1}`}</div>
                  </Button>
                ))}
              </Flex>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
