/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { observer } from '@nocobase/flow-engine';
import { useAIEmployeesData } from './hooks/useAIEmployeesData';
import { useChatBoxStore } from './chatbox/stores/chat-box';
import { useChatBoxActions } from './chatbox/hooks/useChatBoxActions';
import { Button } from 'antd';

export const AICodingButton: React.FC = observer(() => {
  const { aiEmployees } = useAIEmployeesData();

  const setOpen = useChatBoxStore.use.setOpen();

  const { switchAIEmployee } = useChatBoxActions();
  return (
    <Button
      shape="circle"
      onClick={() => {
        setOpen(true);
        if (aiEmployees.length) {
          switchAIEmployee(aiEmployees[0]);
        }
      }}
    >
      AI
    </Button>
  );
});
