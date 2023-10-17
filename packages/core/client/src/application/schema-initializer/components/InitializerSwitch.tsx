import { Switch } from 'antd';
import React, { FC } from 'react';
import { InitializerItemProps, InitializerItem } from './InitializerItem';
import { useCompile } from '../../../schema-component';

export interface InitializerSwitchItemProps extends InitializerItemProps {
  checked?: boolean;
  disabled?: boolean;
}

export const InitializerSwitch: FC<InitializerSwitchItemProps> = (props) => {
  const { title, checked, ...resets } = props;
  const compile = useCompile();
  return (
    <InitializerItem {...resets}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {compile(title)} <Switch style={{ marginLeft: 20 }} size={'small'} checked={checked} />
      </div>
    </InitializerItem>
  );
};
