/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';

export const getPageSchema = (schema: any) => {
  if (schema?.['x-component'] === 'Page') {
    return schema;
  }
  if (schema?.parent) {
    return getPageSchema(schema?.parent);
  }
  return undefined;
};
