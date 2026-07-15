/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { observer } from '@nocobase/flow-engine';
import { AIEmployeeDropdown } from '../../AIEmployeeDropdown';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatBoxStore } from '../stores/chat-box';

export const AIEmployeeSwitcher: React.FC<{
  disabled?: boolean;
  allowedUsernames?: string[];
}> = observer(({ disabled, allowedUsernames }) => {
  const repository = useAIConfigRepository();
  const allowedUsernameSet = allowedUsernames?.length ? new Set(allowedUsernames) : null;
  const aiEmployees = allowedUsernameSet
    ? repository.aiEmployees.filter((employee) => allowedUsernameSet.has(employee.username))
    : repository.aiEmployees;
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const { switchAIEmployee } = useChatBoxActions();

  useEffect(() => {
    repository.getAIEmployees().catch(console.error);
  }, [repository]);

  return (
    <AIEmployeeDropdown
      aiEmployees={aiEmployees}
      currentEmployee={currentEmployee}
      disabled={disabled}
      onSelect={(employee) =>
        switchAIEmployee(employee, {
          clear: {
            sender: false,
            attachments: false,
            contextItems: false,
          },
        })
      }
    />
  );
});
