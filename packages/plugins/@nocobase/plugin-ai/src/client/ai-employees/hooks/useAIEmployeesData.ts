/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowEngine } from '@nocobase/flow-engine';
import { AIEmployee } from '../types';
import { useRequest } from '@nocobase/client';

export const useAIEmployeesData = () => {
  const flowEngine = useFlowEngine();

  const { loading, data } = useRequest<{
    aiEmployees: AIEmployee[];
    aiEmployeesMap: {
      [username: string]: AIEmployee;
    };
  }>(() => flowEngine.context.aiEmployeesData);
  const aiEmployees = data?.aiEmployees || [];
  const aiEmployeesMap = data?.aiEmployeesMap || {};
  return {
    loading,
    aiEmployees,
    aiEmployeesMap,
    refresh: () => flowEngine.context.removeCache('aiEmployeesData'),
  };
};
