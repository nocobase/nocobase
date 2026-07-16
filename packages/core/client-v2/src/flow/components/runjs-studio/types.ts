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
import type { CodeEditorJsonSchema } from '../code-editor';

export interface RunJSWorkspaceFileLike {
  path: string;
  content: string;
  language?: string;
  mode?: string;
}

export type RunJSWorkspaceJsonSchemaResolver = (
  path: string,
  files: RunJSWorkspaceFileLike[],
) => CodeEditorJsonSchema | undefined;

export type RunJSSourceLocator =
  | {
      kind: 'flowModel.step';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      paramPath: readonly string[];
      versionPath?: readonly string[];
    }
  | {
      kind: 'flowModel.nestedRunJS';
      modelUid: string;
      containerFlowKey: string;
      containerStepKey: string;
      valuePath: ReadonlyArray<string | number>;
      scene: string;
    }
  | {
      kind: 'flowModel.flowRegistry.runjs';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      sourcePath: readonly string[];
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

export type EmbeddedRunJSEditorSaveResult = 'saved' | 'unchanged' | 'cancelled';

export interface EmbeddedRunJSEditorController {
  dirty: boolean;
  saving: boolean;
  requestSave: () => Promise<EmbeddedRunJSEditorSaveResult>;
}

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
  paramPath?: readonly string[];
  versionPath?: readonly string[];
  label?: string;
  sourceLabel?: string;
  /**
   * Host-defined metadata exposed to shared RunJS editor integrations.
   * Providers should treat it as descriptive context and keep persistence decisions server-authoritative.
   */
  sourceMetadata?: Record<string, unknown>;
  onPreview?: (value: RunJSValue) => void | Promise<void>;
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
  editorChrome?: 'standalone' | 'embedded';
  workspaceJsonSchemaResolver?: RunJSWorkspaceJsonSchemaResolver;
  onEmbeddedEditorControllerChange?: (controller: EmbeddedRunJSEditorController | null) => void;
}

export interface RunJSEditorProviderRenderProps extends Omit<RunJSEditorFieldProps, 'value'> {
  value: RunJSValue;
  /**
   * Notifies the host after the provider has already persisted the value server-side.
   * The host should refresh local runtime state without issuing another persistence request.
   */
  onPersistedChange?: (value: RunJSValue) => void | Promise<void>;
  renderNext?: (overrides?: Partial<RunJSEditorProviderRenderProps>) => React.ReactNode;
}

export interface RunJSEditorProvider {
  key: string;
  priority?: number;
  canHandle?: (props: RunJSEditorProviderRenderProps) => boolean;
  renderEditor: (props: RunJSEditorProviderRenderProps) => React.ReactNode;
}
