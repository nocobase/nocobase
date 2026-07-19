/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  LegacyRunJSEditorRegistry,
  type LegacyRunJSEditorProviderRenderProps,
  type RunJSSourceLocator,
} from '@nocobase/client';
import { useNodeContext } from '@nocobase/plugin-workflow/client';
import React from 'react';

import { usePluginTranslation } from '../locale';
import CodeEditor from './CodeEditor';

export type WorkflowRunJSEditorFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
};

type WorkflowNodeContext = {
  id?: string | number;
};

function isNodeId(value: unknown): value is string | number {
  return typeof value === 'string' || typeof value === 'number';
}

export const WorkflowRunJSEditorField: React.FC<WorkflowRunJSEditorFieldProps> = ({
  value,
  onChange,
  disabled,
  readOnly,
}) => {
  const node = useNodeContext() as WorkflowNodeContext | null;
  const { t } = usePluginTranslation();
  const code = typeof value === 'string' ? value : '';
  const nodeId = isNodeId(node?.id) ? node.id : null;
  const locator: RunJSSourceLocator | null =
    nodeId !== null
      ? {
          kind: 'workflow.javascript',
          nodeId,
        }
      : null;
  const providerProps: LegacyRunJSEditorProviderRenderProps | null = locator
    ? {
        locator,
        value: {
          code,
          version: 'workflow-js',
        },
        label: t('Workflow JavaScript'),
        sourceLabel: t('Script content'),
        scene: 'workflow.javascript',
        surfaceStyle: 'workflow' as const,
        disabled,
        readOnly,
        onChange: (nextValue) => {
          onChange?.(nextValue.code);
        },
      }
    : null;
  const provider = providerProps ? LegacyRunJSEditorRegistry.getProvider(providerProps) : null;

  if (provider && providerProps) {
    return <>{provider.renderEditor(providerProps)}</>;
  }

  return <CodeEditor value={code} onChange={onChange} disabled={Boolean(disabled || readOnly)} />;
};

export default WorkflowRunJSEditorField;
