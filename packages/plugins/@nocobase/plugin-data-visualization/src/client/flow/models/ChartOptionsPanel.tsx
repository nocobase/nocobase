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
import { ObjectField, Field, connect, useForm, observer } from '@formily/react';
import { ChartOptionsEditor } from './ChartOptionsEditor';
import { useT } from '../../locale';
import { FunctionOutlined, LineChartOutlined } from '@ant-design/icons';
import { ChartOptionsBuilder } from './ChartOptionsBuilder';

const OptionsMode: React.FC = connect(({ value = 'custom', onChange }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(value) => {
        onChange(value);
      }}
    >
      <Radio.Button value="builder">
        <LineChartOutlined /> {t('Basic')}
      </Radio.Button>
      <Radio.Button value="custom">
        <FunctionOutlined /> {t('Custom')}
      </Radio.Button>
    </Radio.Group>
  );
});

export const ChartOptionsPanel: React.FC = observer(() => {
  const form = useForm();
  const mode = form?.values?.chart?.option?.mode || 'custom';

  return (
    <ObjectField name="chart.option">
      <div
        style={{
          marginBottom: '8px',
        }}
      >
        <Field name="mode" component={[OptionsMode]} />
      </div>
      {mode === 'builder' ? (
        <ChartOptionsBuilder />
      ) : (
        <Field
          name="raw"
          component={[ChartOptionsEditor]}
          initialValue={`return {
}`}
        />
      )}
    </ObjectField>
  );
});
