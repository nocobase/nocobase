/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useRequest } from 'ahooks';
import { useFlowContext } from '@nocobase/flow-engine';

export const useJsonTemplateResolver = (template: string, deps: any[] = []) => {
  const ctx = useFlowContext();

  return useRequest(
    async () => {
      const value = await ctx.resolveJsonTemplate(template);
      return value;
    },
    {
      refreshDeps: deps,
    },
  );
};
