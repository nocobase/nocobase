/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';

/**
 * Finds the root schema of a block by traversing through Grid components
 *
 * @param schema - The schema object to search through, implementing ISchema interface
 * @returns The first non-Grid schema found in the tree, or null if no schema is provided
 *
 * This function:
 * 1. Returns null if no schema is provided
 * 2. For Grid/Grid.Row/Grid.Col components, recursively searches their properties
 * 3. Returns the first non-Grid schema encountered
 */
export const findBlockRootSchema = (schema?: ISchema) => {
  if (!schema) {
    return null;
  }

  if (['Grid', 'Grid.Row', 'Grid.Col'].includes(schema['x-component'])) {
    let ret = null;
    for (const s of Object.values(schema['properties'] || {})) {
      ret = findBlockRootSchema(s);
      if (ret) {
        break;
      }
    }
    return ret;
  }

  return schema;
};
