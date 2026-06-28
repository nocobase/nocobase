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

import { CodeEditor } from '../code-editor';
import { RunJSEditorRegistry } from './RunJSEditorRegistry';
import type { RunJSEditorFieldProps, RunJSEditorProviderRenderProps } from './types';

function normalizeEditorValue(value: unknown): RunJSValue {
  return isRunJSValue(value) ? normalizeRunJSValue(value) : { code: '', version: 'v2' };
}

export const RunJSEditorField: React.FC<RunJSEditorFieldProps> = (props) => {
  const {
    t,
    value,
    onChange,
    height = '200px',
    scene = 'formValue',
    readOnly,
    disabled,
    containerStyle = { flex: 1, minWidth: 0 },
  } = props;
  const current = normalizeEditorValue(value);
  const providerProps: RunJSEditorProviderRenderProps = {
    ...props,
    value: current,
    height,
    scene,
    readOnly,
    disabled,
    containerStyle,
  };
  const provider = RunJSEditorRegistry.getProvider(providerProps);

  if (provider) {
    return <>{provider.renderEditor(providerProps)}</>;
  }

  const tip = t?.('Use return to output value') ?? 'Use return to output value';
  const placeholderText = `// ${tip}`;

  return (
    <div style={containerStyle}>
      <CodeEditor
        value={current.code}
        onChange={(code) => onChange?.({ ...current, code })}
        version={current.version}
        height={height}
        enableLinter
        placeholder={placeholderText}
        scene={scene}
        readonly={readOnly || disabled}
      />
    </div>
  );
};
