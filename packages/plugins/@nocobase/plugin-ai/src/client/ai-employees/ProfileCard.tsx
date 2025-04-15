/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Avatar, Divider, Typography } from 'antd';
import { useToken } from '@nocobase/client';
import { AIEmployee } from './types';
import { avatars } from './avatars';
import { useT } from '../locale';

export const ProfileCard: React.FC<{
  aiEmployee: AIEmployee;
  taskDesc?: string;
}> = (props) => {
  const { aiEmployee, taskDesc } = props;
  const { token } = useToken();
  const t = useT();

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
          {taskDesc && (
            <>
              <Divider
                orientation="left"
                plain
                style={{
                  fontStyle: 'italic',
                }}
              >
                {t('Task description')}
              </Divider>
              <Typography.Paragraph>{taskDesc}</Typography.Paragraph>
            </>
          )}
        </>
      ) : null}
    </div>
  );
};
