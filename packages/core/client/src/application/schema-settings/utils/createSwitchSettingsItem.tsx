/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsItemType, useCompile, useDesignable } from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import _ from 'lodash';

import { getNewSchema, useHookDefault } from './util';

export interface CreateSwitchSchemaSettingsItemProps {
  name: string;
  title: string;
  schemaKey: string;
  defaultValue?: boolean;
  useDefaultValue?: () => boolean;
}

/**
 * create `switch` type schema settings item
 *
 * @internal
 * @unstable
 */
export function createSwitchSettingsItem(options: CreateSwitchSchemaSettingsItemProps): SchemaSettingsItemType {
  const { name, schemaKey, title, defaultValue: propsDefaultValue, useDefaultValue = useHookDefault } = options;
  return {
    name,
    type: 'switch',
    useComponentProps() {
      const filedSchema = useFieldSchema();
      const { deepMerge } = useDesignable();
      const defaultValue = useDefaultValue(propsDefaultValue);
      const compile = useCompile();

      return {
        title: compile(title),
        checked: !!_.get(filedSchema, schemaKey, defaultValue),
        onChange(v) {
          deepMerge(getNewSchema(filedSchema, schemaKey, v));
        },
      };
    },
  };
}
