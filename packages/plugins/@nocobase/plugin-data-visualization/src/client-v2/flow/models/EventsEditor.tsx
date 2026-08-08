/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { RunJSEditorField, type RunJSSourceLocator } from '@nocobase/client-v2';
import type { RunJSValue } from '@nocobase/flow-engine';
import { CodeEditor } from '../components/CodeEditor';

const EventsEditor: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  sourceLocator?: RunJSSourceLocator;
  sourceLabel?: string;
  onPreview?: (value: RunJSValue) => void | Promise<void>;
}> = (props) => {
  if (props.sourceLocator) {
    return (
      <RunJSEditorField
        value={props.value || ''}
        onChange={(next) => {
          props.onChange?.(typeof next === 'string' ? next : next.code);
        }}
        sourceLocator={props.sourceLocator}
        label={props.sourceLabel}
        sourceLabel={props.sourceLabel}
        surfaceStyle="action"
        scene="chart.events"
        onPreview={props.onPreview}
        height="240px"
      />
    );
  }

  return <CodeEditor language="javascript" value={props.value} onChange={props.onChange} />;
};

export default EventsEditor;
