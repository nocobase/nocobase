/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { TFunction, useTranslation } from 'react-i18next';

import { useColumnSchema } from '../../../schema-component';
import { useCompile } from '../../../schema-component/hooks/useCompile';
import { useDesignable } from '../../../schema-component/hooks/useDesignable';
import { SchemaSettingsItemType } from '../types';
import { getNewSchema, useHookDefault, useSchemaByType } from './util';

export interface CreateSwitchSchemaSettingsItemProps {
  name: string;
  title: string | ((t: TFunction<'translation', undefined>) => string);
  schemaKey: string;
  defaultValue?: boolean;
  useDefaultValue?: () => boolean;
  useVisible?: () => boolean;
  useComponentProps?: () => any;
  /**
   * @default 'common'
   */
  type?: 'common' | 'field';
}

/**
 * create `switch` type schema settings item
 *
 * @internal
 * @unstable
 */
export function createSwitchSettingsItem(options: CreateSwitchSchemaSettingsItemProps): SchemaSettingsItemType {
  const {
    name,
    useVisible,
    schemaKey,
    title,
    type = 'common',
    defaultValue: propsDefaultValue,
    useDefaultValue = useHookDefault,
    useComponentProps: useComponentPropsFromProps,
  } = options;
  return {
    name,
    useVisible,
    type: 'switch',
    useComponentProps() {
      const fieldSchema = useSchemaByType(type);
      const { dn } = useDesignable();
      const defaultValue = useDefaultValue(propsDefaultValue);
      const compile = useCompile();
      const { t } = useTranslation();
      const { fieldSchema: tableColumnSchema } = useColumnSchema() || {};
      const dynamicComponentProps = useComponentPropsFromProps?.();

      return {
        title: typeof title === 'function' ? title(t) : compile(title),
        checked:
          dynamicComponentProps?.checked === undefined
            ? !!_.get(fieldSchema, schemaKey, defaultValue)
            : dynamicComponentProps?.checked,
        onChange(v) {
          dynamicComponentProps?.onChange?.(v);
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
}
