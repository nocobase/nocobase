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
import { TFunction, useTranslation } from 'react-i18next';

export interface CreateSwitchSchemaSettingsItemProps {
  name: string;
  title: string | ((t: TFunction<'translation', undefined>) => string);
  schemaKey: string;
  defaultValue?: boolean;
  useDefaultValue?: () => boolean;
  useVisible?: () => boolean;
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
    defaultValue: propsDefaultValue,
    useDefaultValue = useHookDefault,
  } = options;
  return {
    name,
    useVisible,
    type: 'switch',
    useComponentProps() {
      const filedSchema = useFieldSchema();
      const { deepMerge } = useDesignable();
      const defaultValue = useDefaultValue(propsDefaultValue);
      const compile = useCompile();
      const { t } = useTranslation();

      return {
        title: typeof title === 'function' ? title(t) : compile(title),
        checked: !!_.get(filedSchema, schemaKey, defaultValue),
        onChange(v) {
          deepMerge(getNewSchema({ fieldSchema: filedSchema, schemaKey, value: v }));
        },
      };
    },
  };
}
