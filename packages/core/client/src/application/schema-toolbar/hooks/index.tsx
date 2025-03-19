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
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ErrorFallback, useComponent, useDesignable } from '../../../schema-component';
import { SchemaToolbar, SchemaToolbarProps } from '../../../schema-settings/GeneralSchemaDesigner';

const SchemaToolbarErrorFallback: React.FC<FallbackProps> = (props) => {
  const { designable } = useDesignable();

  if (!designable) {
    return null;
  }

  return (
    <ErrorFallback.Modal {...props}>
      <SchemaToolbar title={`render toolbar error: ${props.error.message}`} />
    </ErrorFallback.Modal>
  );
};

export const useSchemaToolbarRender = (fieldSchema: ISchema) => {
  const { designable } = useDesignable();
  const toolbar = useMemo(() => {
    if (fieldSchema['x-designer'] || fieldSchema['x-toolbar']) {
      return fieldSchema['x-designer'] || fieldSchema['x-toolbar'];
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
      return (
        <ErrorBoundary FallbackComponent={SchemaToolbarErrorFallback} onError={console.error}>
          <C {...fieldSchema['x-toolbar-props']} {...props} />
        </ErrorBoundary>
      );
    },
    exists: !!C,
  };
};
