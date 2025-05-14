/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { z } from 'zod';
import { ToolOptions } from '../manager/ai-manager';

export const formFiller: ToolOptions = {
  title: '{{t("Form filler")}}',
  description: '{{t("Fill the form with the given content")}}',
  execution: 'frontend',
  schema: z.object({
    form: z.string().describe('The UI Schema ID of the target form to be filled.'),
    data: z.record(z.any()).describe("Structured data matching the form's JSON Schema, to be assigned to form.values."),
  }),
  invoke: async () => {
    return {
      status: 'success',
      content: 'I have filled the form with the provided data.',
    };
  },
};
