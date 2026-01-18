/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC, useMemo } from 'react';
import { useGridCardBlockDecoratorProps } from './useGridCardBlockDecoratorProps';
import { SchemaComponentOptions, useSchemaOptionsContext } from '../../schema-component';

export const ResetSchemaOptionsProvider: FC = (props) => {
  const { scope: desktopScopes } = useSchemaOptionsContext();
  const scopes = useMemo(
    () => ({
      useGridCardBlockDecoratorProps: (innerProps) =>
        useGridCardBlockDecoratorProps(innerProps, desktopScopes?.useGridCardBlockDecoratorProps),
    }),
    [desktopScopes?.useGridCardBlockDecoratorProps],
  );
  return <SchemaComponentOptions scope={scopes}>{props.children}</SchemaComponentOptions>;
};
