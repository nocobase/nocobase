/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngineContext, PropertyOptions } from '@nocobase/flow-engine';
import { AIEmployee } from '../../types';

export const aiEmployeesData: [string, PropertyOptions] = [
  'aiEmployeesData',
  {
    get: async (ctx: FlowEngineContext) => {
      const aiEmployees: AIEmployee[] = await ctx.api
        .resource('aiEmployees')
        .listByUser()
        .then((res) => res?.data?.data);

      const aiEmployeesMap: {
        [username: string]: AIEmployee;
      } = (aiEmployees || []).reduce((acc, aiEmployee) => {
        acc[aiEmployee.username] = aiEmployee;
        return acc;
      }, {});

      return { aiEmployees, aiEmployeesMap };
    },
  },
];
