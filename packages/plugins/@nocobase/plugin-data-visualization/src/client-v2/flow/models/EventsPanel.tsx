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
import EventsEditor from './EventsEditor';
import { useT } from '../../locale';
import { FunctionOutlined } from '@ant-design/icons';
import { observer, useFlowSettingsContext, type RunJSValue } from '@nocobase/flow-engine';
import type { RunJSSourceLocator } from '@nocobase/client-v2';
import { cloneFormValues } from './cloneFormValues';

const DEFAULT_EVENTS_RAW = `// const handler = function() {
//   ctx.openView(ctx.model.uid + '-1', {
//     mode: 'dialog',
//     size: 'large',
//     defineProperties: {}, // inject context into the new view
//   });
// };
// chart.on('click', 'series', handler);
// return () => chart.off('click', handler);
`;

const getFormValues = (ctx: any) => ctx.getStepFormValues('chartSettings', 'configure') || {};

const setIn = (target: any, path: string[], value: any) => {
  let cursor = target;
  path.slice(0, -1).forEach((key) => {
    cursor[key] = cursor[key] || {};
    cursor = cursor[key];
  });
  cursor[path[path.length - 1]] = value;
};

const OptionsMode: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
}> = ({ value = 'custom', onChange }) => {
  const t = useT();
  return (
    <Radio.Group
      value={value}
      onChange={(event) => {
        onChange?.(event.target.value);
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
};

export const EventsPanel: React.FC = observer(() => {
  const t = useT();
  const ctx = useFlowSettingsContext<any>();
  const [, forceUpdate] = React.useState(0);
  const formValues = getFormValues(ctx);
  const mode = formValues?.chart?.events?.mode || 'custom';
  const rawValue = formValues?.chart?.events?.raw ?? DEFAULT_EVENTS_RAW;
  const sourceLocator: RunJSSourceLocator | undefined = ctx?.model?.uid
    ? {
        kind: 'chart.events',
        modelUid: ctx.model.uid,
      }
    : undefined;

  React.useEffect(() => {
    const values = getFormValues(ctx);
    if (!values?.chart?.events?.mode) {
      setIn(values, ['chart', 'events', 'mode'], 'custom');
    }
    if (!values?.chart?.events?.raw) {
      setIn(values, ['chart', 'events', 'raw'], DEFAULT_EVENTS_RAW);
    }
  }, [ctx]);

  const updateEventValue = (path: string[], value: any) => {
    const values = getFormValues(ctx);
    setIn(values, path, value);
    forceUpdate((v) => v + 1);
  };

  const handleRawPreview = async (next: RunJSValue) => {
    const values = cloneFormValues(getFormValues(ctx));
    setIn(values, ['chart', 'events', 'mode'], 'custom');
    setIn(values, ['chart', 'events', 'raw'], next.code);
    await ctx.model.onPreview(values);
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          padding: 1,
        }}
      >
        <OptionsMode value={mode} onChange={(value) => updateEventValue(['chart', 'events', 'mode'], value)} />
        {mode === 'custom' ? (
          <Button
            type="link"
            onClick={async () => {
              await ctx.model.onPreview(getFormValues(ctx));
            }}
          >
            {t('Preview')}
          </Button>
        ) : null}
      </div>

      <EventsEditor
        value={rawValue}
        onChange={(value) => updateEventValue(['chart', 'events', 'raw'], value)}
        sourceLocator={sourceLocator}
        sourceLabel={t('Chart events')}
        onPreview={handleRawPreview}
      />
    </>
  );
});
