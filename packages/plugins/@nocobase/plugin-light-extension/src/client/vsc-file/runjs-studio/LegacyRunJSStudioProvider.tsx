/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  useAPIClient,
  type LegacyRunJSEditorProvider,
  type LegacyRunJSEditorProviderRenderProps,
  type RunJSSourceLocator,
} from '@nocobase/client';
import { FlowContextProvider, type FlowContext, type RunJSValue } from '@nocobase/flow-engine';
import type { RunJSEditorProviderRenderProps } from '@nocobase/client-v2';
import React from 'react';

import { runJSStudioProvider } from '../../../client-v2/vsc-file/runjs-studio';
import { useT } from '../locale';

type LegacyFlowContext = {
  api: ReturnType<typeof useAPIClient>;
};

type LegacyRunJSStudioEditorProps = LegacyRunJSEditorProviderRenderProps & {
  sourceLocator?: RunJSSourceLocator;
};

export const legacyRunJSStudioProvider: LegacyRunJSEditorProvider = {
  key: '@nocobase/plugin-vsc-file/legacy-runjs-studio',
  canHandle: (props) => {
    const studioProps = props as LegacyRunJSStudioEditorProps;
    return (studioProps.sourceLocator ?? studioProps.locator)?.kind === 'flowModel.step';
  },
  renderEditor: (props) => <LegacyRunJSStudioEditorEntry {...props} />,
};

function LegacyRunJSStudioEditorEntry(props: LegacyRunJSStudioEditorProps) {
  const api = useAPIClient();
  const t = useT();
  const context = React.useMemo<LegacyFlowContext>(
    () => ({
      api,
    }),
    [api],
  );
  const providerProps: RunJSEditorProviderRenderProps = {
    ...props,
    t,
    onChange: (value) => {
      props.onChange?.(normalizeRunJSValue(value, props.value.version));
    },
    onPersistedChange: (value) => {
      props.onChange?.(normalizeRunJSValue(value, props.value.version));
    },
  };

  return (
    <FlowContextProvider context={context as unknown as FlowContext}>
      {runJSStudioProvider.renderEditor(providerProps)}
    </FlowContextProvider>
  );
}

function normalizeRunJSValue(value: RunJSValue | string, fallbackVersion: string): RunJSValue {
  if (typeof value === 'string') {
    return {
      code: value,
      version: fallbackVersion,
    };
  }

  return value;
}
