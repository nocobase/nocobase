/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCompile } from '@nocobase/client';
import { Select } from 'antd';
import React, { useRef, useState, useEffect } from 'react';

export interface SelectWithTitleProps {
  title?: any;
  getDefaultValue?: any;
  options?: any;
  fieldNames?: any;
  onChange?: (...args: any[]) => void;
}

export function SelectWithTitle({
  title,
  getDefaultValue,
  onChange,
  options,
  fieldNames,
  ...others
}: SelectWithTitleProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<any>('');
  const [fieldKey, setFieldKey] = useState('');
  const compile = useCompile();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!getDefaultValue) return;

      try {
        const val = await getDefaultValue();
        if (cancelled || !val) return;

        const entries = Object.entries(val);
        if (!entries.length) return;

        const [key, result] = entries[0];
        setValue(result);
        setFieldKey(key);
      } catch (e) {
        console.error(e);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [getDefaultValue]);

  const timerRef = useRef<any>(null);

  const handleChange = (val: any) => {
    setValue(val);
    onChange?.({ [fieldKey]: val });
  };
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
        {...others}
        open={open}
        popupMatchSelectWidth={false}
        bordered={false}
        value={value}
        onChange={handleChange}
        popupClassName={`select-popup-${title.replaceAll(' ', '-')}`}
        fieldNames={fieldNames}
        options={compile(options)}
        style={{ textAlign: 'right', minWidth: 100 }}
        onMouseEnter={() => {
          clearTimeout(timerRef.current);
        }}
      />
    </div>
  );
}
