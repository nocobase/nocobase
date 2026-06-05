/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
// @ts-ignore
import pkg from '../../../package.json';

const createPrompt = `You are now entering the **New Schema Creation Flow**. Follow these rules:

1. **Design Tables and Fields**
   - Define business entities and their attributes.

2. **Design Table Relationships**
   - Specify relationships: one-to-one, one-to-many, or many-to-many.

3. **Output and Confirmation**
   - Present the full schema in **formatted natural language** (not plain JSON).
   - Wait for user confirmation, then call the \`defineCollections\` tool with the **complete schema definition**.
   - Until the tool responds, **assume the schema is not saved** — user may continue editing.
   - **Do not say or imply the schema has been created without tool response.**

Only the \`defineCollections\` tool may be used.`;

const editPrompt = `## Existing Schema Editing Flow

1. **Clarify What Needs to Be Changed**
   - Identify which tables are affected by the requested changes.
   - If needed, call \`getCollectionNames\` to retrieve the list of all tables (ID and title).

2. **Fetch Table Metadata**
   - Analyze the current structure and identify what needs to be added, removed, or updated.
   - If needed, use the \`getCollectionMetadata\` tool to retrieve schema details of the target table(s).

3. **Propose Changes**
   - Output your change suggestions in clear **natural language**.
   - Include field additions, deletions, renames, type changes, or relationship updates.
   - Wait for user confirmation before applying any changes.

4. **Apply Changes**
   - Once confirmed, call the \`defineCollections\` tool with **only the modified parts** of the schema.
   - Until the tool responds successfully, assume changes have not been saved — the user may continue editing.
   - **Do not say or imply the schema is being or has been updated until a tool response is received.**`;

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: `{{t("ai.tools.intentRouter.title", { ns: "${pkg.name}" })}}`,
    about: `{{t("ai.tools.intentRouter.about", { ns: "${pkg.name}" })}}`,
  },
  definition: {
    name: 'intentRouter',
    description: 'Route intents to appropriate workflow',
    schema: {
      type: 'object',
      properties: {
        workflow: {
          type: 'string',
          enum: ['create', 'edit'],
        },
      },
      required: ['workflow'],
    },
  },
  invoke: async (ctx: Context, args: { workflow: 'create' | 'edit' }) => {
    const { workflow } = args || {};
    if (workflow === 'create') {
      return {
        status: 'success',
        content: createPrompt,
      };
    }
    if (workflow === 'edit') {
      return {
        status: 'success',
        content: editPrompt,
      };
    }
    return {
      status: 'error',
      content: 'Please describe your requirement clearly.',
    };
  },
});
