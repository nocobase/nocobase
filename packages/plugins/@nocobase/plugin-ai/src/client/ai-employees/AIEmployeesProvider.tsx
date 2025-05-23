/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext, useMemo } from 'react';
import { createContext } from 'react';
import { ChatBoxProvider } from './chatbox/ChatBoxProvider';
import { useAPIClient, useRequest } from '@nocobase/client';
import { AIEmployee } from './types';
import { AISelectionProvider } from './selector/AISelectorProvider';
import { ChatMessagesProvider } from './chatbox/ChatMessagesProvider';
import { ChatConversationsProvider } from './chatbox/ChatConversationsProvider';
import { AISettingsProvider } from './AISettingsProvider';

export const AIEmployeesContext = createContext<{
  aiEmployees: AIEmployee[];
  setAIEmployees: (aiEmployees: AIEmployee[]) => void;
  service: any;
  aiEmployeesMap: Record<string, AIEmployee>;
}>({} as any);

export const AIEmployeesProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const [aiEmployees, setAIEmployees] = React.useState<AIEmployee[]>(null);

  const api = useAPIClient();
  const service = useRequest<AIEmployee[]>(
    () =>
      api
        .resource('aiEmployees')
        .listByUser()
        .then((res) => res?.data?.data),
    {
      onSuccess: (aiEmployees) => setAIEmployees(aiEmployees),
    },
  );
  const aiEmployeesMap = useMemo(() => {
    return (aiEmployees || []).reduce((acc, aiEmployee) => {
      acc[aiEmployee.username] = aiEmployee;
      return acc;
    }, {});
  }, [aiEmployees]);

  return (
    <AISelectionProvider>
      <AISettingsProvider>
        <AIEmployeesContext.Provider value={{ aiEmployees, setAIEmployees, service, aiEmployeesMap }}>
          <ChatConversationsProvider>
            <ChatMessagesProvider>
              <ChatBoxProvider>{props.children}</ChatBoxProvider>
            </ChatMessagesProvider>
          </ChatConversationsProvider>
        </AIEmployeesContext.Provider>
      </AISettingsProvider>
    </AISelectionProvider>
  );
};

export const useAIEmployeesContext = () => {
  const ctx = useContext(AIEmployeesContext);
  return ctx;
};
