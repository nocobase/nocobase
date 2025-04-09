/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Bubble } from '@ant-design/x';
import { useChatBoxContext } from './ChatBoxContext';
import { ReactComponent as EmptyIcon } from '../empty-icon.svg';

export const Messages: React.FC = () => {
  const { messages, roles } = useChatBoxContext();
  return (
    <>
      {messages?.length ? (
        <Bubble.List
          style={{
            marginRight: '8px',
          }}
          roles={roles}
          items={messages}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            width: '64px',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <EmptyIcon />
        </div>
      )}
    </>
  );
};
