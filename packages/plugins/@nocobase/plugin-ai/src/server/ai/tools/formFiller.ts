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

export default defineTools({
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  execution: 'frontend',
  introduction: {
    title: '{{t("Form filler")}}',
    about: '{{t("Fill the form with the given content")}}',
  },
  definition: {
    name: 'formFiller',
    description: 'Fill the form with the given content',
    schema: z.object({
      form: z.string().describe('The UI Schema ID of the target form to be filled.'),
      data: z
        .object({})
        .catchall(z.any())
        .describe(
          `Structured key-value pairs matching the form's JSON Schema,
       to be assigned to form.values.
       Example: { "username": "alice", "email": "alice@example.com", "age": 30 }`,
        ),
    }),
  },
  invoke: async () => {
    return {
      status: 'success',
      content: 'I have filled the form with the provided data.',
    };
  },
});
