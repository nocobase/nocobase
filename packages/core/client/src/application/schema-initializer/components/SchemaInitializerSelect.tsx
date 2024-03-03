import { Select, SelectProps } from 'antd';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { SchemaInitializerItemProps, SchemaInitializerItem } from './SchemaInitializerItem';
import { useSchemaInitializerItem } from '../context';

export interface SchemaInitializerSelectItemProps extends SchemaInitializerItemProps {
  options?: SelectProps['options'];
  value?: SelectProps['defaultValue'];
  onChange?: SelectProps['onChange'];
  openOnHover?: boolean;
}

export const SchemaInitializerSelect: FC<SchemaInitializerSelectItemProps> = (props) => {
  const { title, options, value, onChange, openOnHover, onClick: _onClick, ...others } = props;
  const [open, setOpen] = useState(false);

  const onClick = useCallback(
    (...args) => {
      setOpen(false);
      _onClick?.(...args);
    },
    [setOpen, _onClick],
  );
  const onMouseEnter = useCallback(() => setOpen(true), []);

  // 鼠标 hover 时，打开下拉框
  const moreProps = useMemo(
    () =>
      openOnHover
        ? {
            onMouseEnter,
            open,
          }
        : {},
    [onMouseEnter, open, openOnHover],
  );

  return (
    <SchemaInitializerItem {...others}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <Select
          data-testid="antd-select"
          popupMatchSelectWidth={false}
          bordered={false}
          defaultValue={value}
          onChange={(...arg) => (setOpen(false), onChange(...arg))}
          options={options}
          style={{ textAlign: 'right', minWidth: 100 }}
          onClick={onClick}
          {...moreProps}
        />
      </div>
    </SchemaInitializerItem>
  );
};

export const SchemaInitializerSelectInternal = () => {
  const itemConfig = useSchemaInitializerItem<SchemaInitializerSelectItemProps>();
  return <SchemaInitializerSelect {...itemConfig} />;
};
