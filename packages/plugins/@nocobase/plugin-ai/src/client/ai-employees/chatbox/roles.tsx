/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { GetProp, Popover, Avatar, Space, Spin } from 'antd';
import { Bubble } from '@ant-design/x';
import { AIMessage, ErrorMessage, HintMessage, TaskMessage, UserMessage } from './MessageRenderer';
import { AIEmployee } from '../types';
import { ProfileCard } from '../ProfileCard';
import { avatars } from '../avatars';
import { LoadingOutlined } from '@ant-design/icons';
import { useT } from '../../locale';
import { AIThinking } from './AIThinking';

export const defaultRoles: GetProp<typeof Bubble.List, 'roles'> = {
  user: {
    placement: 'end',
    styles: {
      content: {
        maxWidth: '80%',
        margin: '0 8px 8px 0',
      },
    },
    variant: 'borderless',
    messageRender: (msg: any) => {
      return <UserMessage msg={msg} />;
    },
  },
  error: {
    placement: 'start',
    variant: 'borderless',
    styles: {
      content: {
        margin: '8px 16px',
      },
    },
    messageRender: (msg: any) => <ErrorMessage msg={msg} />,
  },
  hint: {
    placement: 'start',
    variant: 'borderless',
    messageRender: (msg: any) => <HintMessage msg={msg} />,
  },
  task: {
    placement: 'start',
    variant: 'borderless',
    styles: {
      content: {
        margin: '0px 16px 8px',
      },
    },
    messageRender: (msg: any) => <TaskMessage msg={msg} />,
  },
};

export const aiEmployeeRole = (aiEmployee: AIEmployee) => ({
  placement: 'start',
  // avatar: aiEmployee.avatar ? (
  //   <Popover content={<ProfileCard aiEmployee={aiEmployee} />} placement="leftTop">
  //     <Avatar shape="circle" size="large" src={avatars(aiEmployee.avatar)} />
  //   </Popover>
  // ) : null,
  typing: { step: 5, interval: 20 },
  variant: 'borderless',
  styles: {
    content: {
      width: '95%',
      margin: '8px 16px',
      marginInlineEnd: 16,
      minHeight: 0,
    },
  },
  messageRender: (msg: any) => {
    return <AIMessage msg={msg} />;
  },
  loadingRender: () => <AIThinking nickname={aiEmployee.nickname} />,
});
