/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type SnippetModule = {
  content: string;
  contexts?: string[]; // e.g., ['JSBlockRunJSContext'] or ['*']
  versions?: string[]; // e.g., ['v1'] or ['*']
  prefix?: string; // completion trigger text
  label?: string; // display name in snippets list
  description?: string; // optional longer description
};
