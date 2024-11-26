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
import { useCompile } from '../../../schema-component';
import { useSchemaInitializerItem } from '../context';
import { SchemaInitializerItem, SchemaInitializerItemProps } from './SchemaInitializerItem';

export interface SchemaInitializerSwitchItemProps extends SchemaInitializerItemProps {
  checked?: boolean;
  disabled?: boolean;
}

const switchStyle = { marginLeft: 20 };
const itemStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

export const SchemaInitializerSwitch: FC<SchemaInitializerSwitchItemProps> = (props) => {
  const { title, checked, ...resets } = props;
  const compile = useCompile();
  return (
    <SchemaInitializerItem {...resets} closeInitializerMenuWhenClick={false}>
      <div style={itemStyle}>
        {compile(title)}
        <Switch disabled={props.disabled} style={switchStyle} size={'small'} checked={checked} />
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
