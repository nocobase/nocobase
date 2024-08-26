/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TFunction, useTranslation } from 'react-i18next';

import { useHookDefault } from './util';
import { SchemaSettingsItemType } from '../types';
import { useCompile } from '../../../schema-component/hooks/useCompile';

export interface CreateTextSchemaSettingsItemProps {
  name: string;
  useVisible?: () => boolean;
  title: string | ((t: TFunction<'translation', undefined>) => string);
  useTextClick: () => void;
}

export function createTextSettingsItem(options: CreateTextSchemaSettingsItemProps): SchemaSettingsItemType {
  const { name, useVisible, title, useTextClick = useHookDefault } = options;
  return {
    name,
    type: 'item',
    useVisible,
    useComponentProps() {
      const compile = useCompile();
      const { t } = useTranslation();
      const onClick = useTextClick();
      return {
        title: typeof title === 'function' ? title(t) : compile(title),
        onClick,
      };
    },
  };
}
