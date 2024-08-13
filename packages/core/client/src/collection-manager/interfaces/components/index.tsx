/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Switch, Radio, Input } from 'antd';
import React, { useEffect, useState } from 'react';

export const TargetKey = () => {
  return <div>Target key</div>;
};

export const ThroughCollection = () => {
  return (
    <div>
      Through collection{' '}
      <Switch size={'small'} defaultChecked checkedChildren="Auto fill" unCheckedChildren="Customize" />
    </div>
  );
};

export const SourceKey = () => {
  return <div>Source key</div>;
};

export const ForeignKey = () => {
  return (
    <div>
      Foreign key <Switch size={'small'} defaultChecked checkedChildren="Auto fill" unCheckedChildren="Customize" />
    </div>
  );
};

export const ForeignKey1 = () => {
  return (
    <div>
      Foreign key 1 <a>新建</a>
    </div>
  );
};

export const ForeignKey2 = () => {
  return (
    <div>
      Foreign key 2 <a>新建</a>
    </div>
  );
};

// 自定义 Radio 组件
export const CustomRadio = (props) => {
  const { options, onChange } = props;
  const [value, setValue] = useState(props.value);
  useEffect(() => {
    setValue(['server', 'client'].includes(props.value) ? props.value : 'custom');
  }, [props.value]);
  const handleRadioChange = (e) => {
    setValue(e.target.value);
    if (e.target.value !== 'custom') {
      onChange?.(e.target.value);
    }
  };

  return (
    <Radio.Group onChange={handleRadioChange} value={value}>
      {options.map((option) => (
        <Radio key={option.value} value={option.value}>
          {option.label}
          {option.value === 'custom' && value === 'custom' ? (
            <Input
              style={{ width: 200, marginLeft: 10 }}
              onChange={(e) => {
                onChange?.(e.target.value);
              }}
              value={['server', 'client', 'custom'].includes(props.value) ? null : props.value}
            />
          ) : null}
        </Radio>
      ))}
    </Radio.Group>
  );
};
