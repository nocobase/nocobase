/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { TimePicker } from 'antd';
import { Picker } from 'antd-mobile';
import React, { useState } from 'react';

export const MobileTimePicker = (props) => {
  const [visible, setVisible] = useState(false);
  // 小时、分钟和秒的数据
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const seconds = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const timeData = [
    hours, // 小时
    minutes, // 分钟
    seconds, // 秒
  ];
  const handleTimeChange = (value: [string, string, string]) => {
    props.onChange(`${value[0]}:${value[1]}:${value[2]}`);
    setVisible(false);
  };

  return (
    <div onClick={() => setVisible(true)}>
      <TimePicker {...props} style={{ pointerEvents: 'none', width: '100%' }} />
      <Picker onConfirm={handleTimeChange} columns={timeData} visible={visible} />
    </div>
  );
};
