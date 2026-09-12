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
import { listAccessibleAIEmployees, serializeEmployeeSummary } from './shared';
// @ts-ignore
import pkg from '../../../../package.json';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("List AI employee", { ns: "${pkg.name}" })}}`,
    about: `{{t("Get the list of available AI employees", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'list-ai-employees',
    description: 'List accessible AI employees with their basic profile and skill settings.',
    schema: z.object({}).describe('No input is required.'),
  },
  async invoke(ctx) {
    const employees = await listAccessibleAIEmployees(ctx);
    return {
      aiEmployees: employees.map((employee) => serializeEmployeeSummary(ctx, employee)),
    };
  },
});
