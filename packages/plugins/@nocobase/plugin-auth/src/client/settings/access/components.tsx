/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { InputNumber, Select, Space } from 'antd';
const { Option } = Select;
export const TimeUnits = () => {
  <Select defaultValue="minutes" style={{ width: 120 }}>
    <Option value="minutes">Minutes</Option>
    <Option value="hours">Hours</Option>
    <Option value="days">Days</Option>
  </Select>;
};

const InputInterval = (props) => {
  const { value, onChange } = props;
  return <InputNumber addonAfter={TimeUnits} />;
};
