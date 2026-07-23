/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect } from 'react';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { aiEmployeeRole, defaultRoles } from '../roles';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';

export const useChatBoxEffect = () => {
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployees = aiConfigRepository.aiEmployees;
  const open = useChatBoxStore.use.open();
  const senderRef = useChatBoxStore.use.senderRef();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setRoles = useChatBoxStore.use.setRoles();
  const currentConversation = useChatConversationsStore.use.currentConversation();

  useEffect(() => {
    aiConfigRepository.getAIEmployees().catch(console.error);
  }, [aiConfigRepository]);

  useEffect(() => {
    const employeeRoles = aiEmployees.reduce<Record<string, ReturnType<typeof aiEmployeeRole>>>(
      (previous, employee) => {
        return {
          ...previous,
          [employee.username]: aiEmployeeRole(employee),
        };
      },
      {},
    );

    setRoles((previous) => ({
      ...previous,
      ...defaultRoles,
      ...employeeRoles,
    }));
  }, [aiEmployees, setRoles]);

  useEffect(() => {
    senderRef?.current?.focus();
  }, [currentEmployee, senderRef]);

  useEffect(() => {
    if (open) {
      senderRef?.current?.focus();
    }
  }, [open, senderRef]);

  useEffect(() => {
    if (open) {
      aiConfigRepository.refreshAITools(currentConversation).catch(console.error);
    }
  }, [aiConfigRepository, currentConversation, open]);
};
