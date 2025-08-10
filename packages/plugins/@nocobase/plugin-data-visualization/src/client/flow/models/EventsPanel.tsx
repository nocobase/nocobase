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
import { ChartEventsEditor } from './ChartEventsEditor';
import { useT } from '../../locale';
import { FunctionOutlined, InteractionOutlined } from '@ant-design/icons';

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
        <InteractionOutlined /> {t('Basic')}
      </Radio.Button>
      <Radio.Button value="custom">
        <FunctionOutlined /> {t('Custom')}
      </Radio.Button>
    </Radio.Group>
  );
});

export const EventsPanel: React.FC = () => {
  return (
    <ObjectField name="chart.events">
      <div
        style={{
          marginBottom: '8px',
        }}
      >
        <Field
          name="mode"
          component={[OptionsMode]}
          reactions={(field) => {
            const basic = field.query('.basic').take();
            if (basic) {
              basic.setState({
                visible: field.value === 'basic',
              });
            }
            const raw = field.query('.raw').take();
            if (raw) {
              raw.setState({
                visible: field.value === 'custom',
              });
            }
          }}
          initialValue="custom"
        />
      </div>
      <Field name="basic" />
      <Field
        name="raw"
        component={[ChartEventsEditor]}
        initialValue={`// chart.off('click');
// chart.on('click', 'series', function() {
//  ctx.openView({ mode: 'dialog', size: 'large '});
// });
      `}
      />
    </ObjectField>
  );
};
