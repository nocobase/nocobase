/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { InputNumber, Select } from 'antd';
import { connect, mapProps } from '@formily/react';
import { useAuthTranslation } from '../../locale';
const { Option } = Select;

const InputTime = connect(
  (props) => {
    const { t } = useAuthTranslation();
    const { value, onChange, ...restProps } = props;
    const regex = /^(\d+)([a-zA-Z]+)$/;
    const match = value ? value.match(regex) : null;
    useEffect(() => {
      if (!match) onChange('1m');
    }, [match, onChange]);
    const [time, unit] = match ? [parseInt(match[1]), match[2]] : [0, 'm'];
    const TimeUnits = (
      <Select value={unit} onChange={(unit) => onChange(`${time}${unit}`)} style={{ width: 120 }}>
        <Option value="s">{t('Seconds')}</Option>
        <Option value="m">{t('Minutes')}</Option>
        <Option value="h">{t('Hours')}</Option>
        <Option value="d">{t('Days')}</Option>
      </Select>
    );

    return (
      <InputNumber value={time} addonAfter={TimeUnits} onChange={(time) => onChange(`${time}${unit}`)} {...restProps} />
    );
  },
  mapProps({
    onInput: 'onChange',
  }),
);

export const componentsNameMap = {
  InputTime: 'InputTime',
};

export const componentsMap = {
  [componentsNameMap.InputTime]: InputTime,
};
