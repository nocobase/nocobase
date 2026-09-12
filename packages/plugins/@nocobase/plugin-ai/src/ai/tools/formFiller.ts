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
// @ts-ignore
import pkg from '../../../package.json';

export default defineTools({
  scope: 'GENERAL',
  defaultPermission: 'ALLOW',
  execution: 'frontend',
  introduction: {
    title: `{{t("Form filler", { ns: "${pkg.name}" })}}`,
    about: `{{t("Fill form fields with the given content. This tool only writes values into the form UI; it does not submit or save the form.", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'formFiller',
    description:
      'Fill form fields with the given content. This tool only writes values into the form UI; it does not submit, save, create, or update records. After using it, tell the user to review the filled values and manually submit the form.',
    schema: z.object({
      form: z.string().describe('The UI Schema ID of the target form to be filled.'),
      data: z
        .object({})
        .catchall(z.any())
        .describe(
          `Structured key-value pairs matching the form's JSON Schema,
       to be assigned to form.values.
       This only populates fields in the form UI and does not submit, save, create, or update records.
       Example: { "username": "alice", "email": "alice@example.com", "age": 30 }`,
        ),
    }),
  },
  invoke: async () => {
    return {
      status: 'success',
      content:
        'I have filled the form with the provided data. Please review the values and manually submit the form to save the data.',
    };
  },
});
