/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { isRunJSValue, normalizeRunJSValue, type RunJSValue } from '@nocobase/flow-engine';
import { CodeEditor } from './code-editor';

export interface RunJSValueEditorProps {
  t?: (key: string) => string;
  value: unknown;
  onChange?: (value: RunJSValue) => void;
  height?: string;
  scene?: string;
  containerStyle?: React.CSSProperties;
}

export const RunJSValueEditor: React.FC<RunJSValueEditorProps> = (props) => {
  const {
    t,
    value,
    onChange,
    height = '200px',
    scene = 'formValue',
    containerStyle = { flex: 1, minWidth: 0 },
  } = props;

  const current: RunJSValue = isRunJSValue(value) ? normalizeRunJSValue(value) : { code: '', version: 'v1' };
  const tip = t?.('Use return to output value') ?? 'Use return to output value';
  const placeholderText = `// ${tip}`;

  return (
    <div style={containerStyle}>
      <CodeEditor
        value={current.code}
        onChange={(code) => onChange?.({ ...current, code })}
        height={height}
        enableLinter
        placeholder={placeholderText}
        scene={scene}
      />
    </div>
  );
};
