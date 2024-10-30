/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useField, useFieldSchema } from '@formily/react';
import React, { FC, useMemo } from 'react';
import { useDesignable } from '../../../schema-component';
import { SchemaSettingsDropdown } from '../../../schema-settings';
import { SchemaSettingOptions } from '../types';
import { SchemaSettingsChildren } from './SchemaSettingsChildren';
import { SchemaSettingsIcon } from './SchemaSettingsIcon';

/**
 * @internal
 */
export const SchemaSettingsWrapper: FC<SchemaSettingOptions<any>> = React.memo((props) => {
  const { items, Component = SchemaSettingsIcon, name, componentProps, style, ...others } = props;
  const { dn } = useDesignable();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const cProps = useMemo(
    () => ({
      options: props,
      style,
      ...componentProps,
    }),
    [componentProps, props, style],
  );
  return (
    <SchemaSettingsDropdown
      title={React.createElement(Component, cProps)}
      dn={dn}
      field={field}
      fieldSchema={fieldSchema}
      {...others}
    >
      <SchemaSettingsChildren>{items}</SchemaSettingsChildren>
    </SchemaSettingsDropdown>
  );
});

SchemaSettingsWrapper.displayName = 'SchemaSettingsWrapper';
