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

export type RunJSSourceLocator =
  | {
      kind: 'flowModel.step';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      paramPath: string[];
      versionPath?: string[];
    }
  | {
      kind: 'flowModel.nestedRunJS';
      modelUid: string;
      containerFlowKey: string;
      containerStepKey: string;
      valuePath: Array<string | number>;
      scene: string;
    }
  | {
      kind: 'flowModel.flowRegistry.runjs';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      sourcePath: string[];
    }
  | {
      kind: 'workflow.javascript';
      nodeId: string | number;
    }
  | {
      kind: 'chart.option';
      modelUid: string;
    }
  | {
      kind: 'chart.events';
      modelUid: string;
    };

export type RunJSSourceKind = RunJSSourceLocator['kind'];

export type RunJSSurfaceStyle = 'render' | 'action' | 'value' | 'workflow';

export type RunJSLocatorFactory = 'flowModel.step';

export interface RunJSEditorFieldProps {
  t?: (key: string) => string;
  value?: unknown;
  onChange?: (value: RunJSValue | string) => void;
  locator?: RunJSSourceLocator;
  sourceLocator?: RunJSSourceLocator;
  locatorFactory?: RunJSLocatorFactory;
  flowKey?: string;
  stepKey?: string;
  paramPath?: string[];
  versionPath?: string[];
  label?: string;
  sourceLabel?: string;
  scene?: string;
  surfaceStyle?: RunJSSurfaceStyle;
  height?: string | number;
  minHeight?: string | number;
  theme?: 'light' | 'dark';
  enableLinter?: boolean;
  wrapperStyle?: React.CSSProperties;
  readOnly?: boolean;
  disabled?: boolean;
  containerStyle?: React.CSSProperties;
}

export interface RunJSEditorProviderRenderProps extends Omit<RunJSEditorFieldProps, 'value'> {
  value: RunJSValue;
}

export interface RunJSEditorProvider {
  key: string;
  canHandle?: (props: RunJSEditorProviderRenderProps) => boolean;
  renderEditor: (props: RunJSEditorProviderRenderProps) => React.ReactNode;
}
