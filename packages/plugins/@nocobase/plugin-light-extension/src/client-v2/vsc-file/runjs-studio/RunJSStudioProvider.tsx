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
  canHandle: (props) => (props.sourceLocator ?? props.locator)?.kind === 'flowModel.step',
  renderEditor: (props) => <RunJSStudioEditorEntry {...props} />,
};

function RunJSStudioEditorEntry(props: RunJSEditorProviderRenderProps) {
  return useRunJSStudioController({
    ...props,
    locator: cloneRunJSSourceLocator(props.sourceLocator ?? props.locator),
  });
}

function cloneRunJSSourceLocator(locator: RunJSEditorProviderRenderProps['locator']): RunJSSourceLocator | undefined {
  if (!locator) {
    return undefined;
  }
  if (locator.kind !== 'flowModel.step') {
    return undefined;
  }
  return {
    ...locator,
    paramPath: [...locator.paramPath],
    versionPath: locator.versionPath ? [...locator.versionPath] : undefined,
  };
}
