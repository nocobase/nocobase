import React, { useEffect, useState } from 'react';
import { Menu, Switch } from 'antd';
import { useCompile } from '../hooks/useCompile';

export interface SwitchMenuItemProps {
  onChange?: any;
  title?: any;
  checked?: boolean;
}

export function SwitchMenuItem(props: SwitchMenuItemProps) {
  const { onChange } = props;
  const compile = useCompile();
  const [checked, setChecked] = useState(props.checked);
  useEffect(() => {
    setChecked(props.checked);
  }, [props.checked]);
  return (
    <Menu.Item
      style={{ minWidth: 150 }}
      onClick={async () => {
        setChecked((checked) => {
          onChange(!checked);
          return !checked;
        });
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{compile(props.title)}</span>
        <Switch checked={checked} size={'small'} />
      </div>
    </Menu.Item>
  );
}

export default SwitchMenuItem;
