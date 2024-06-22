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
import { TFunction, useTranslation } from 'react-i18next';

import { getNewSchema, useHookDefault } from './util';

export interface CreateModalSchemaSettingsItemProps {
  name: string;
  title: string | ((t: TFunction<'translation', undefined>) => string);
  parentSchemaKey?: string;
  defaultValue?: any;
  useDefaultValue?: () => any;
  schema: (defaultValue: any) => ISchema;
  valueKeys?: string[];
  useVisible?: () => boolean;
  width?: number | string;
  useSubmit?: () => (values: any) => void;
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
    useSubmit = useHookDefault,
    useVisible,
    defaultValue: propsDefaultValue,
    useDefaultValue = useHookDefault,
    width,
  } = options;
  return {
    name,
    type: 'actionModal',
    useVisible,
    useComponentProps() {
      const fieldSchema = useFieldSchema();
      const { deepMerge } = useDesignable();
      const defaultValue = useDefaultValue(propsDefaultValue);
      const values = parentSchemaKey ? _.get(fieldSchema, parentSchemaKey) : undefined;
      const compile = useCompile();
      const { t } = useTranslation();
      const onSubmit = useSubmit();

      return {
        title: typeof title === 'function' ? title(t) : compile(title),
        width,
        schema: schema({ ...defaultValue, ...values }),
        onSubmit(values) {
          deepMerge(getNewSchema({ fieldSchema, parentSchemaKey, value: values, valueKeys }));
          onSubmit(values);
        },
      };
    },
  };
}
