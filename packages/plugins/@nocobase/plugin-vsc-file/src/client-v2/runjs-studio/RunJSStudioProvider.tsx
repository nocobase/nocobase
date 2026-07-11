/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSEditorProvider, RunJSEditorProviderRenderProps } from '@nocobase/client-v2';
import React from 'react';

import type { RunJSSourceLocator } from './types';
import { useRunJSStudioController } from './useRunJSStudioController';

export const runJSStudioProvider: RunJSEditorProvider = {
  key: '@nocobase/plugin-vsc-file/runjs-studio',
  canHandle: (props) => Boolean(props.locator),
  renderEditor: (props) => <RunJSStudioEditorEntry {...props} />,
};

function RunJSStudioEditorEntry(props: RunJSEditorProviderRenderProps) {
  return useRunJSStudioController({
    ...props,
    locator: cloneRunJSSourceLocator(props.locator),
  });
}

function cloneRunJSSourceLocator(locator: RunJSEditorProviderRenderProps['locator']): RunJSSourceLocator | undefined {
  if (!locator) {
    return undefined;
  }
  if (locator.kind === 'flowModel.step') {
    return {
      ...locator,
      paramPath: [...locator.paramPath],
      versionPath: locator.versionPath ? [...locator.versionPath] : undefined,
    };
  }
  if (locator.kind === 'flowModel.nestedRunJS') {
    return {
      ...locator,
      valuePath: [...locator.valuePath],
    };
  }
  if (locator.kind === 'flowModel.flowRegistry.runjs') {
    return {
      ...locator,
      sourcePath: [...locator.sourcePath],
    };
  }
  return { ...locator };
}
