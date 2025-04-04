/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { createContext } from 'react';
import { ChatBoxProvider } from './chatbox/ChatBoxProvider';
import { useAPIClient, useRequest } from '@nocobase/client';
import { AIEmployee } from './types';

export const AIEmployeesContext = createContext<{
  aiEmployees: AIEmployee[];
  setAIEmployees: (aiEmployees: AIEmployee[]) => void;
}>({} as any);

export const AIEmployeesProvider: React.FC<{
  children: React.ReactNode;
}> = (props) => {
  const [aiEmployees, setAIEmployees] = React.useState<AIEmployee[]>(null);

  return (
    <AIEmployeesContext.Provider value={{ aiEmployees, setAIEmployees }}>
      <ChatBoxProvider>{props.children}</ChatBoxProvider>
    </AIEmployeesContext.Provider>
  );
};

export const useAIEmployeesContext = () => {
  const { aiEmployees, setAIEmployees } = useContext(AIEmployeesContext);
  const api = useAPIClient();
  const service = useRequest<AIEmployee[]>(
    () =>
      api
        .resource('aiEmployees')
        .list()
        .then((res) => res?.data?.data),
    {
      ready: !aiEmployees,
      onSuccess: (aiEmployees) => setAIEmployees(aiEmployees),
    },
  );
  return { aiEmployees, service };
};
