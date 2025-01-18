/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { useComponent, useDesignable } from '.';
import { useMemo } from 'react';
import { SchemaToolbar } from '../../schema-settings';

const DefaultSchemaToolbar = () => null;
DefaultSchemaToolbar.isNullComponent = true;

/**
 * @deprecated
 * use `useSchemaToolbarRender` instead
 */
export const useDesigner = () => {
  const { designable } = useDesignable();
  const fieldSchema = useFieldSchema();

  const toolbar = useMemo(() => {
    if (fieldSchema['x-designer'] || fieldSchema['x-toolbar'])
      return fieldSchema['x-designer'] || fieldSchema['x-toolbar'];

    if (fieldSchema['x-settings']) {
      return SchemaToolbar;
    }
    return DefaultSchemaToolbar;
  }, [fieldSchema]);

  const component = useComponent(toolbar);
  return designable ? component || DefaultSchemaToolbar : DefaultSchemaToolbar;
};
