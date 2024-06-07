/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { useFieldSchema } from '@formily/react';
import { SchemaSettingsItemType, SelectProps, useCompile, useDesignable } from '@nocobase/client';
import { getNewSchema, useHookDefault } from './util';

interface CreateSelectSchemaSettingsItemProps {
  name: string;
  title: string;
  options?: SelectProps['options'];
  useOptions?: () => SelectProps['options'];
  schemaKey: string;
  defaultValue?: string | number;
  useDefaultValue?: () => string | number;
}

/**
 * create `select` type schema settings item
 *
 * @internal
 * @unstable
 */
export const createSelectSchemaSettingsItem = (
  options: CreateSelectSchemaSettingsItemProps,
): SchemaSettingsItemType => {
  const {
    name,
    title,
    options: propsOptions,
    useOptions = useHookDefault,
    schemaKey,
    defaultValue: propsDefaultValue,
    useDefaultValue = useHookDefault,
  } = options;
  return {
    name,
    type: 'select',
    useComponentProps() {
      const filedSchema = useFieldSchema();
      const { deepMerge } = useDesignable();
      const options = useOptions(propsOptions);
      const defaultValue = useDefaultValue(propsDefaultValue);
      const compile = useCompile();

      return {
        title: compile(title),
        options,
        value: _.get(filedSchema, schemaKey, defaultValue),
        onChange(v) {
          deepMerge(getNewSchema({ fieldSchema: filedSchema, schemaKey, value: v }));
        },
      };
    },
  };
};
