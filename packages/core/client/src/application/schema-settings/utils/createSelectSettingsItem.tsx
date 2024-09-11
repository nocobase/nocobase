/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { useField, useFieldSchema } from '@formily/react';
import { TFunction, useTranslation } from 'react-i18next';

import { SchemaSettingsItemType } from '../types';
import { getNewSchema, useHookDefault, useSchemaByType } from './util';
import { SelectProps } from '../../../schema-component/antd/select';
import { useCompile } from '../../../schema-component/hooks/useCompile';
import { useDesignable } from '../../../schema-component/hooks/useDesignable';
import { useColumnSchema } from '../../../schema-component';

interface CreateSelectSchemaSettingsItemProps {
  name: string;
  title: string | ((t: TFunction<'translation', undefined>) => string);
  options?: SelectProps['options'];
  useOptions?: () => SelectProps['options'];
  schemaKey: string;
  defaultValue?: string | number;
  useDefaultValue?: () => string | number;
  useVisible?: () => boolean;
  /**
   * @default 'common'
   */
  type?: 'common' | 'field';
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
    useVisible,
    type = 'common',
    defaultValue: propsDefaultValue,
    useDefaultValue = useHookDefault,
  } = options;
  return {
    name,
    type: 'select',
    useVisible,
    useComponentProps() {
      const fieldSchema = useSchemaByType(type);
      const { fieldSchema: tableColumnSchema } = useColumnSchema() || {};
      const { dn } = useDesignable();
      const options = useOptions(propsOptions);
      const defaultValue = useDefaultValue(propsDefaultValue);
      const compile = useCompile();
      const { t } = useTranslation();

      return {
        title: typeof title === 'function' ? title(t) : compile(title),
        options,
        value: _.get(fieldSchema, schemaKey, defaultValue),
        onChange(v) {
          const newSchema = getNewSchema({ fieldSchema, schemaKey, value: v });
          if (tableColumnSchema) {
            dn.emit('patch', {
              schema: newSchema,
            });
            dn.refresh();
          } else {
            dn.deepMerge(newSchema);
          }
        },
      };
    },
  };
};
