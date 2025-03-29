/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { get } from 'lodash';
import React, { createContext, ReactNode, useContext } from 'react';

interface EvaluateContextProps {
  data: Record<string, any>;
  context: Record<string, any>;
  getValue: (field: string) => Promise<any>;
}

const EvaluateContext = createContext<EvaluateContextProps>({ data: {}, context: {}, getValue: async () => null });

export const VariableEvaluateProvider: React.FC<{
  children: ReactNode;
  data: Record<string, any>;
  context: Record<string, any>;
}> = ({ children, data, context }) => {
  const getValueFromData = async (field: string): Promise<any> => {
    return getValue({ field, data, context });
  };
  return (
    <EvaluateContext.Provider value={{ data, context, getValue: getValueFromData }}>
      {children}
    </EvaluateContext.Provider>
  );
};

export const useVariableEvaluateContext = (): EvaluateContextProps => {
  const context = useContext(EvaluateContext);
  if (!context) {
    throw new Error('useEvaluate must be used within an EvaluateProvider');
  }
  return context;
};

const getValue = async (params: {
  field: string;
  data: Record<string, any>;
  context?: Record<string, any>;
}): Promise<any> => {
  const { field, data, context } = params;
  const path = field.split('.');

  // Handle scope functions (starting with $)
  if (path[0].startsWith('$')) {
    const dataKey = path.slice(1).join('.');
    const scopeKey = path[0];
    const scopeFn = data[scopeKey];
    if (typeof scopeFn === 'function') {
      const scopeResult = await scopeFn({ fields: [dataKey], data, context });
      if (scopeResult?.getValue) {
        return scopeResult.getValue({ field: dataKey, keys: [] });
      }
    }
    return null;
  }

  const value = get(data, field);
  if (typeof value === 'function') {
    return value();
  }

  return value;
};
