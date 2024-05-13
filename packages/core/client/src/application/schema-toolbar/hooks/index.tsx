/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import React, { useMemo } from 'react';
import { useComponent, useDesignable } from '../../../schema-component';
import { SchemaToolbar, SchemaToolbarProps } from '../../../schema-settings/GeneralSchemaDesigner';

export const useSchemaToolbarRender = (fieldSchema: ISchema) => {
  const { designable } = useDesignable();
  const toolbar = useMemo(() => {
    if (fieldSchema['x-toolbar'] || fieldSchema['x-designer']) {
      return fieldSchema['x-toolbar'] || fieldSchema['x-designer'];
    }

    if (fieldSchema['x-settings']) {
      return SchemaToolbar;
    }
  }, [fieldSchema]);

  const C = useComponent(toolbar);
  return {
    render(props?: SchemaToolbarProps & { [index: string]: any }) {
      if (!designable || !C) {
        return null;
      }
      return <C {...fieldSchema['x-toolbar-props']} {...props} />;
    },
    exists: !!C,
  };
};
