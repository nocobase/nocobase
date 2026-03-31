/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineTools } from '@nocobase/ai';
import { z } from 'zod';
import { getAccessibleAIEmployee, serializeEmployeeDetail } from './shared';
// @ts-ignore
import pkg from '../../../../package.json';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("Get AI employee", { ns: "${pkg.name}" })}}`,
    about: `{{t("Get the detailed definition of AI employee", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'get-ai-employee',
    description: 'Get the detailed profile of one accessible AI employee by username.',
    schema: z.object({
      username: z.string().describe('The username of the AI employee.'),
    }),
  },
  async invoke(ctx, args) {
    const employee = await getAccessibleAIEmployee(ctx, args.username);
    if (!employee) {
      throw new Error(`AI employee "${args.username}" not found`);
    }

    return serializeEmployeeDetail(ctx, employee);
  },
});
