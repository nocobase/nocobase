/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Switch } from 'antd';
import React, { FC } from 'react';
import { SchemaInitializerItemProps, SchemaInitializerItem } from './SchemaInitializerItem';
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerItem } from '../context';

export interface SchemaInitializerSwitchItemProps extends SchemaInitializerItemProps {
  checked?: boolean;
  disabled?: boolean;
}

export const SchemaInitializerSwitch: FC<SchemaInitializerSwitchItemProps> = (props) => {
  const { title, checked, ...resets } = props;
  const compile = useCompile();
  return (
    <SchemaInitializerItem {...resets} closeInitializerMenuWhenClick={false}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {compile(title)}
        <Switch disabled={props.disabled} style={{ marginLeft: 20 }} size={'small'} checked={checked} />
      </div>
    </SchemaInitializerItem>
  );
};

/**
 * @internal
 */
export const SchemaInitializerSwitchInternal = () => {
  const itemConfig = useSchemaInitializerItem<SchemaInitializerSwitchItemProps>();
  return <SchemaInitializerSwitch {...itemConfig} />;
};
