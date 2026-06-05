/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Radio } from 'antd';
import { ObjectField, Field, connect, useForm } from '@formily/react';
import EventsEditor from './EventsEditor';
import { useT } from '../../locale';
import { FunctionOutlined } from '@ant-design/icons';
import { observer, useFlowSettingsContext } from '@nocobase/flow-engine';

const DEFAULT_EVENTS_RAW = `// chart.off('click');
// chart.on('click', 'series', function() {
//   ctx.openView(ctx.model.uid + '-1', {
//     mode: 'dialog',
//     size: 'large',
//     defineProperties: {}, // inject context into the new view
//   });
// });
`;

const OptionsMode: React.FC = connect(({ value = 'custom', onChange }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(value) => {
        onChange(value);
      }}
    >
      {/* <Radio.Button disabled value="basic">
        <InteractionOutlined /> {t('Basic')}
      </Radio.Button> */}
      <Radio.Button value="custom">
        <FunctionOutlined /> {t('Custom')}
      </Radio.Button>
    </Radio.Group>
  );
});

export const EventsPanel: React.FC = observer(() => {
  const t = useT();
  const form = useForm();
  const ctx = useFlowSettingsContext<any>();
  const mode = form?.values?.chart?.events?.mode || 'custom';
  const rawValue = form?.values?.chart?.events?.raw;

  return (
    <ObjectField name="chart.events">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          padding: 1,
        }}
      >
        <Field name="mode" component={[OptionsMode]} initialValue="custom" />
        {mode === 'custom' ? (
          <Button
            type="link"
            onClick={async () => {
              // 写入事件参数，统一走 onPreview 方便回滚
              await ctx.model.onPreview(form.values);
            }}
          >
            {t('Preview')}
          </Button>
        ) : null}
      </div>

      {/* 保持原有编辑器 */}
      <Field name="raw" component={[EventsEditor]} initialValue={DEFAULT_EVENTS_RAW} />
    </ObjectField>
  );
});
