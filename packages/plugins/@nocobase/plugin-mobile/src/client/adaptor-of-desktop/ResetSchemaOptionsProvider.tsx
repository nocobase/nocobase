/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponentOptions, useSchemaOptionsContext } from '@nocobase/client';
import React, { FC, useMemo } from 'react';
import { useGridCardBlockDecoratorProps } from './useGridCardBlockDecoratorProps';

/* 使用移动端专属的 scope 覆盖桌面端的 scope，用于在移动端适配桌面端区块 */
export const ResetSchemaOptionsProvider: FC = (props) => {
  const { scope: desktopScopes } = useSchemaOptionsContext();
  const scopes = useMemo(
    () => ({
      useGridCardBlockDecoratorProps: (props) =>
        useGridCardBlockDecoratorProps(props, desktopScopes?.useGridCardBlockDecoratorProps),
    }),
    [desktopScopes?.useGridCardBlockDecoratorProps],
  );
  return <SchemaComponentOptions scope={scopes}>{props.children}</SchemaComponentOptions>;
};
