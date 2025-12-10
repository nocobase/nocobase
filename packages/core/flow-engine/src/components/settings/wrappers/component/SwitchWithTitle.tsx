/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Switch } from 'antd';
import React, { FC, useState, useEffect } from 'react';
import { observer } from '@formily/react';

const ml32 = { marginLeft: 32 };

export const SwitchWithTitle: FC = observer(({ title, onChange, getDefaultValue, disabled, ...others }: any) => {
  const [checked, setChecked] = useState<boolean>(false);
  const [fieldKey, setFieldKey] = useState('');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!getDefaultValue) return;

      try {
        const val = await getDefaultValue();
        if (cancelled || !val) return;

        const entries = Object.entries(val);
        if (!entries.length) return;

        const [key, value] = entries[0];
        setChecked(!!value);
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

  const handleChange = (val: boolean) => {
    setChecked(val);
    onChange?.({ [fieldKey]: val });
  };
  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      {title}
      <Switch size="small" {...others} checked={checked} style={ml32} onChange={handleChange} disabled={disabled} />
    </div>
  );
});
