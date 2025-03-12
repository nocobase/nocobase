/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { GeneralField } from '@formily/core';
import { Schema } from '@formily/json-schema';
import React, { useMemo } from 'react';
import { Designable } from '../../../schema-component';
import { SchemaSettingsProps } from '../../../schema-settings';
import { useApp } from '../../hooks';
import { SchemaSettingsWrapper } from '../components';
import { SchemaSettings } from '../SchemaSettings';
import { SchemaSettingOptions } from '../types';

type UseSchemaSettingsRenderOptions<T = {}> = Omit<SchemaSettingOptions<T>, 'name' | 'items'> &
  Omit<SchemaSettingsProps, 'title' | 'children'> & {
    fieldSchema?: Schema;
    field?: GeneralField;
    dn?: Designable;
  };

export function useSchemaSettingsRender<T = {}>(
  name: string | SchemaSettings<T>,
  options?: UseSchemaSettingsRenderOptions<T>,
) {
  const app = useApp();
  const schemaSetting = useMemo(
    () => (typeof name === 'object' ? name : app.schemaSettingsManager.get<T>(name)),
    [app.schemaSettingsManager, name],
  );
  if (!name) {
    return {
      exists: false,
      render: () => null,
    };
  }

  if (!schemaSetting) {
    console.error(`[nocobase]: SchemaSettings "${name}" not found`);
    return {
      exists: false,
      render: () => null,
    };
  }
  return {
    exists: true,
    render: (options2: UseSchemaSettingsRenderOptions = {}) => {
      return React.createElement(SchemaSettingsWrapper, {
        ...schemaSetting.options,
        ...options,
        ...options2,
      });
    },
  };
}
