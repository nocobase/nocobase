/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import type { RunJSValue } from '@nocobase/flow-engine';
import {
  RunJSEditorField,
  type EmbeddedRunJSEditorController,
  type RunJSSourceLocator,
  type RunJSSurfaceStyle,
} from './runjs-studio';

export interface RunJSValueEditorProps {
  t?: (key: string) => string;
  value?: unknown;
  onChange?: (value: RunJSValue) => void;
  disabled?: boolean;
  height?: string;
  scene?: string;
  locator?: RunJSSourceLocator;
  sourceLocator?: RunJSSourceLocator;
  sourceLabel?: string;
  surfaceStyle?: RunJSSurfaceStyle;
  containerStyle?: React.CSSProperties;
  editorChrome?: 'standalone' | 'embedded';
  onEmbeddedEditorControllerChange?: (controller: EmbeddedRunJSEditorController | null) => void;
}

export const RunJSValueEditor: React.FC<RunJSValueEditorProps> = (props) => {
  const {
    t,
    value,
    onChange,
    disabled,
    height = '200px',
    scene = 'formValue',
    containerStyle = { flex: 1, minWidth: 0 },
  } = props;

  return (
    <RunJSEditorField
      t={t}
      value={value}
      onChange={(nextValue) => {
        if (typeof nextValue !== 'string') {
          onChange?.(nextValue);
        }
      }}
      height={height}
      scene={scene}
      locator={props.locator}
      sourceLocator={props.sourceLocator}
      sourceLabel={props.sourceLabel}
      surfaceStyle={props.surfaceStyle}
      containerStyle={containerStyle}
      disabled={disabled}
      editorChrome={props.editorChrome}
      onEmbeddedEditorControllerChange={props.onEmbeddedEditorControllerChange}
    />
  );
};
