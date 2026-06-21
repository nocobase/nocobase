/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Switch } from 'antd';
import React, { FC, useEffect, useState } from 'react';
import { useFlowEngineContext } from '../../../../provider';
import { observer } from '../../../../reactive';

const ml32 = { marginLeft: 32 };

export const SwitchWithTitle: FC = observer(
  ({ title, onChange, getDefaultValue, disabled, itemKey, ...others }: any) => {
    const [checked, setChecked] = useState<boolean>(false);
    const ctx = useFlowEngineContext();

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
      onChange?.({ [itemKey]: val });
    };

    // 点击整个容器时触发
    const handleWrapperClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;
      handleChange(!checked);
    };
    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onClick={handleWrapperClick}
      >
        {title}
        <Switch
          size="small"
          {...others}
          checkedChildren={others.checkedChildren ? ctx.t(others.checkedChildren) : undefined}
          unCheckedChildren={others.unCheckedChildren ? ctx.t(others.unCheckedChildren) : undefined}
          checked={checked}
          style={ml32}
          disabled={disabled}
        />
      </div>
    );
  },
);
