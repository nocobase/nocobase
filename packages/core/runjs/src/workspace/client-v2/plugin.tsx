/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type Application, registerRunJSRegistryHost, registerRunJSRuntimeHost } from '@nocobase/client-v2';

import {
  createInlineRunJSWorkspaceSettingsDescriptorProvider,
  type RunJSWorkspaceApiClientLike,
} from './InlineRunJSWorkspaceSettingsDescriptorProvider';
import { runJSStudioProvider } from './runjs-studio';
import { runJSRegistryHost, RunJSEditorRegistry, RunJSSettingsDescriptorProviderRegistry } from './runJSRegistryHost';
import { runJSRuntimeHost } from './runJSRuntimeHost';

export type RunJSWorkspaceClientApplication = Pick<Application, 'apiClient'>;

export function installRunJSStudioClientV2(): () => void {
  return RunJSEditorRegistry.registerProvider({ ...runJSStudioProvider });
}

export function installRunJSWorkspaceClientV2(app: RunJSWorkspaceClientApplication): () => void {
  const disposers: Array<() => void> = [];
  try {
    disposers.push(registerRunJSRegistryHost(runJSRegistryHost));
    disposers.push(registerRunJSRuntimeHost(runJSRuntimeHost));
    disposers.push(installRunJSStudioClientV2());
    disposers.push(
      RunJSSettingsDescriptorProviderRegistry.registerProvider(
        createInlineRunJSWorkspaceSettingsDescriptorProvider(app.apiClient as RunJSWorkspaceApiClientLike),
      ),
    );
  } catch (error) {
    disposeRunJSWorkspaceClientV2(disposers);
    throw error;
  }

  return () => disposeRunJSWorkspaceClientV2(disposers);
}

function disposeRunJSWorkspaceClientV2(disposers: Array<() => void>): void {
  while (disposers.length) {
    disposers.pop()?.();
  }
}
