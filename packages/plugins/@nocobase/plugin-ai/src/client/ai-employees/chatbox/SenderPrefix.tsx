/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useChatBoxContext } from './ChatBoxContext';
import { avatars } from '../avatars';
import { Avatar } from 'antd';

export const SenderPrefix: React.FC = () => {
  const currentEmployee = useChatBoxContext('currentEmployee');
  const switchAIEmployee = useChatBoxContext('switchAIEmployee');
  return currentEmployee ? (
    <Avatar
      src={avatars(currentEmployee.avatar)}
      style={{
        cursor: 'pointer',
      }}
      onClick={() => switchAIEmployee(null)}
    />
  ) : null;
};
