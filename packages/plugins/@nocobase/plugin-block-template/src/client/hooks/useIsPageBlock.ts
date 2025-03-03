/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { useFieldSchema } from '@formily/react';

export const useIsPageBlock = () => {
  const fieldSchema = useFieldSchema();
  const isPageBlock = useMemo(() => {
    if (!fieldSchema || fieldSchema['x-template-uid']) {
      return false;
    }

    let schema = fieldSchema.parent;
    while (schema) {
      if (['Page', 'MobilePage'].includes(schema['x-component'])) {
        return true;
      }
      if (!['Grid', 'Grid.Row', 'Grid.Col'].includes(schema['x-component'])) {
        return false;
      }
      schema = schema.parent;
    }
    return false;
  }, [fieldSchema]);

  return isPageBlock;
};
