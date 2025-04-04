/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { withDynamicSchemaProps } from '@nocobase/client';
import { createContext } from 'react';
import { AttachmentProps } from './types';

export type AIEmployeeChatContext = {
  attachments?: Record<string, AttachmentProps>;
  actions?: Record<
    string,
    {
      title: string;
      description?: string;
      icon?: React.ReactNode;
      action: (aiMessage: string) => void;
    }
  >;
  variableScopes?: any;
};

export const AIEmployeeChatContext = createContext<AIEmployeeChatContext>({} as AIEmployeeChatContext);

export const AIEmployeeChatProvider: React.FC<AIEmployeeChatContext> = withDynamicSchemaProps((props) => {
  return <AIEmployeeChatContext.Provider value={props}>{props.children}</AIEmployeeChatContext.Provider>;
});

export const useAIEmployeeChatContext = () => {
  return useContext(AIEmployeeChatContext);
};
