/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettingsItemType, useCompile, useDesignable } from '@nocobase/client';
import { ISchema, useFieldSchema } from '@formily/react';
import _ from 'lodash';

import { getNewSchema, useHookDefault } from './util';

export interface CreateModalSchemaSettingsItemProps {
  name: string;
  title: string;
  parentSchemaKey: string;
  defaultValue?: any;
  useDefaultValue?: () => any;
  schema: (defaultValue: any) => ISchema;
  valueKeys?: string[];
}

/**
 * create `switch` type schema settings item
 *
 * @internal
 * @unstable
 */
export function createModalSettingsItem(options: CreateModalSchemaSettingsItemProps): SchemaSettingsItemType {
  const {
    name,
    parentSchemaKey,
    valueKeys,
    schema,
    title,
    defaultValue: propsDefaultValue,
    useDefaultValue = useHookDefault,
  } = options;
  return {
    name,
    type: 'actionModal',
    useComponentProps() {
      const fieldSchema = useFieldSchema();
      const { deepMerge } = useDesignable();
      const defaultValue = useDefaultValue(propsDefaultValue);
      const values = _.get(fieldSchema, parentSchemaKey);
      const compile = useCompile();

      return {
        title: compile(title),
        schema: schema({ ...defaultValue, ...values }),
        onSubmit(values) {
          deepMerge(getNewSchema({ fieldSchema, schemaKey: parentSchemaKey, value: values, valueKeys }));
        },
      };
    },
  };
}
