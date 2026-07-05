/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type React from 'react';
import type { RunJSValue } from '@nocobase/flow-engine';

import type { RunJSSourceLocator, RunJSSurfaceStyle } from '../../shared/runjs-source-contracts';

export type { RunJSSourceLocator, RunJSSurfaceStyle } from '../../shared/runjs-source-contracts';

export interface LegacyRunJSEditorProviderRenderProps {
  t?: (key: string) => string;
  value: RunJSValue;
  onChange?: (value: RunJSValue) => void;
  locator?: RunJSSourceLocator;
  label?: string;
  sourceLabel?: string;
  scene?: string;
  surfaceStyle?: RunJSSurfaceStyle;
  readOnly?: boolean;
  disabled?: boolean;
  containerStyle?: React.CSSProperties;
}

export interface LegacyRunJSEditorProvider {
  key: string;
  canHandle?: (props: LegacyRunJSEditorProviderRenderProps) => boolean;
  renderEditor: (props: LegacyRunJSEditorProviderRenderProps) => React.ReactNode;
}
