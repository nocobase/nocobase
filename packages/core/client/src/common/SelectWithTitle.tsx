import { Select } from 'antd';
import React, { useRef, useState } from 'react';

export interface SelectWithTitleProps {
  title?: any;
  defaultValue?: any;
  options?: any;
  fieldNames?: any;
  onChange?: (...args: any[]) => void;
}

export function SelectWithTitle({ title, defaultValue, onChange, options, fieldNames }: SelectWithTitleProps) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<any>(null);
  return (
    <div
      style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
      onMouseLeave={() => {
        timerRef.current = setTimeout(() => {
          setOpen(false);
        }, 200);
      }}
    >
      {title}
      <Select
        open={open}
        popupMatchSelectWidth={false}
        bordered={false}
        defaultValue={defaultValue}
        onChange={onChange}
        fieldNames={fieldNames}
        options={options}
        style={{ textAlign: 'right', minWidth: 100 }}
        onMouseEnter={() => {
          clearTimeout(timerRef.current);
        }}
      />
    </div>
  );
}
