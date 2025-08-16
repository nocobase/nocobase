/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';

export const LLMProviderContext = createContext<{
  provider: string;
}>({ provider: '' });
LLMProviderContext.displayName = 'LLMProvidersContext';

export const LLMProvidersContext = createContext<{
  providers: {
    key: string;
    label: string;
    value: string;
    supportedModel: string[];
  }[];
}>({ providers: [] });
LLMProvidersContext.displayName = 'LLMProviderssContext';

export const useLLMProviders = () => {
  const { providers } = useContext(LLMProvidersContext);
  return providers;
};
