/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Radio } from 'antd';
import { ObjectField, Field, connect } from '@formily/react';
import { ChartOptionsEditor } from './ChartOptionsEditor';
import { useT } from '../../locale';
import { FunctionOutlined, LineChartOutlined } from '@ant-design/icons';

const OptionsMode: React.FC = connect(({ value = 'custom', onChange }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(value) => {
        onChange(value);
      }}
    >
      <Radio.Button disabled value="basic">
        <LineChartOutlined /> {t('Basic')}
      </Radio.Button>
      <Radio.Button value="custom">
        <FunctionOutlined /> {t('Custom')}
      </Radio.Button>
    </Radio.Group>
  );
});

export const ChartOptionsPanel: React.FC = () => {
  return (
    <ObjectField name="chart">
      <ObjectField name="option">
        <div
          style={{
            marginBottom: '8px',
          }}
        >
          <Field name="mode" component={[OptionsMode]} />
        </div>
        <Field name="raw" component={[ChartOptionsEditor]} initialValue="{}" />
      </ObjectField>
    </ObjectField>
  );
};
