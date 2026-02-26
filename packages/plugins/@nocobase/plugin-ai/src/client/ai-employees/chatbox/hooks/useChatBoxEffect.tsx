/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useEffect } from 'react';
import { useChatBoxStore } from '../stores/chat-box';
import { aiEmployeeRole, defaultRoles } from '../roles';
import { useChatConversationActions } from './useChatConversationActions';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';

export const useChatBoxEffect = () => {
  const aiConfigRepository = useAIConfigRepository();
  const aiEmployees = aiConfigRepository.aiEmployees;
  const aiEmployeesDigest = JSON.stringify(aiEmployees || []);

  const open = useChatBoxStore.use.open();
  const senderRef = useChatBoxStore.use.senderRef();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setRoles = useChatBoxStore.use.setRoles();

  const { conversationsService } = useChatConversationActions();

  useEffect(() => {
    aiConfigRepository.getAIEmployees();
  }, [aiConfigRepository]);

  useEffect(() => {
    if (!aiEmployees) {
      setRoles((prev) => ({
        ...prev,
        ...defaultRoles,
      }));
      return;
    }
    const roles = aiEmployees.reduce((prev, aiEmployee) => {
      return {
        ...prev,
        [aiEmployee.username]: aiEmployeeRole(aiEmployee),
      };
    }, {});
    setRoles((prev) => ({
      ...prev,
      ...defaultRoles,
      ...roles,
    }));
  }, [aiEmployeesDigest]);

  useEffect(() => {
    senderRef?.current?.focus();
  }, [currentEmployee]);

  useEffect(() => {
    if (open) {
      conversationsService.run();
      senderRef?.current?.focus();
      aiConfigRepository.refreshAITools();
    }
  }, [open]);

  // Refresh conversations when current employee changes
  useEffect(() => {
    if (currentEmployee && open) {
      conversationsService.run();
    }
  }, [currentEmployee?.username]);
};
