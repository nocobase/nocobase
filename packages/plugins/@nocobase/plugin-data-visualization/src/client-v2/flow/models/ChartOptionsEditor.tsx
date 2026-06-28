/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { RunJSEditorField } from '@nocobase/client-v2';
import type { RunJSValue } from '@nocobase/flow-engine';
import { CodeEditor } from '../components/CodeEditor';
import { CompletionContext } from '@codemirror/autocomplete';
import type { RunJSSourceLocator } from '@nocobase/plugin-vsc-file';

export const ChartOptionsEditor: React.FC<{
  value?: string;
  onChange?: (next: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
  sourceLocator?: RunJSSourceLocator;
  sourceLabel?: string;
  onPreview?: (value: RunJSValue) => void | Promise<void>;
}> = ({ value, onChange, sourceLocator, sourceLabel, onPreview, disabled, style }) => {
  // 保留原有补全提示
  const completions = (context: CompletionContext) => {
    const word = context.matchBefore(/\w*/);
    if (!word) return null;

    const { from, to } = word;
    return {
      from,
      to,
      options: [
        { label: 'ctx.data.objects', type: 'variable', info: 'Original data object' },
        { label: 'ctx.data.rows', type: 'variable', info: 'Data structured by row' },
        { label: 'ctx.data.columns', type: 'variable', info: 'Data structured by column' },
      ],
    };
  };

  if (sourceLocator) {
    return (
      <RunJSEditorField
        value={value || ''}
        onChange={(next) => {
          onChange?.(typeof next === 'string' ? next : next.code);
        }}
        sourceLocator={sourceLocator}
        label={sourceLabel}
        sourceLabel={sourceLabel}
        surfaceStyle="value"
        scene="chart.option"
        disabled={disabled}
        onPreview={onPreview}
        containerStyle={style}
        height="240px"
      />
    );
  }

  return <CodeEditor value={value} onChange={onChange} language="javascript" completions={completions} />;
};
