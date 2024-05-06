/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InputNumber, Slider } from 'antd';
import type { FC } from 'react';
import React from 'react';

export type InputNumberPlusProps = {
  value?: number;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
};

const InputNumberPlus: FC<InputNumberPlusProps> = ({ value, onChange, min, max }) => {
  return (
    <div style={{ display: 'flex', width: 200 }}>
      <Slider style={{ flex: '0 0 120px', marginRight: 12 }} value={value} min={min} max={max} onChange={onChange} />
      <InputNumber value={value} min={min} max={max} onChange={onChange} style={{ flex: 1 }} />
    </div>
  );
};

export default InputNumberPlus;
