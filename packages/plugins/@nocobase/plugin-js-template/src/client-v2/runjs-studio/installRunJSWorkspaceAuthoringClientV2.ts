/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RunJSEditorRegistry, RunJSSettingsDescriptorProviderRegistry } from '@nocobase/client-v2';

import {
  createInlineRunJSWorkspaceSettingsDescriptorProvider,
  type RunJSWorkspaceApiClientLike,
} from './InlineRunJSWorkspaceSettingsDescriptorProvider';
import { runJSStudioProvider } from './RunJSStudioProvider';

export function installRunJSWorkspaceAuthoringClientV2(api: RunJSWorkspaceApiClientLike): () => void {
  const disposers: Array<() => void> = [];
  try {
    disposers.push(RunJSEditorRegistry.registerProvider({ ...runJSStudioProvider }));
    disposers.push(
      RunJSSettingsDescriptorProviderRegistry.registerProvider(
        createInlineRunJSWorkspaceSettingsDescriptorProvider(api),
      ),
    );
  } catch (error) {
    disposeRunJSWorkspaceAuthoring(disposers);
    throw error;
  }

  return () => disposeRunJSWorkspaceAuthoring(disposers);
}

function disposeRunJSWorkspaceAuthoring(disposers: Array<() => void>): void {
  while (disposers.length) {
    disposers.pop()?.();
  }
}
