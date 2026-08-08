/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { LegacyRunJSEditorRegistry } from './runjs-studio/contract';
import { legacyRunJSStudioProvider } from './runjs-studio/LegacyRunJSStudioProvider';
import { installRunJSStudioClientV2, installRunJSWorkspaceClientV2 } from '../client-v2/plugin';
import type { RunJSWorkspaceApiClientLike } from '../client-v2/InlineRunJSWorkspaceSettingsDescriptorProvider';

export function installLegacyRunJSStudioClient(api?: RunJSWorkspaceApiClientLike): () => void {
  const disposeClientV2 = api ? installRunJSWorkspaceClientV2(api) : installRunJSStudioClientV2();
  const disposeLegacy = LegacyRunJSEditorRegistry.registerProvider(legacyRunJSStudioProvider);

  return () => {
    disposeLegacy();
    disposeClientV2();
  };
}

export function installRunJSWorkspaceLegacyClient(api: RunJSWorkspaceApiClientLike): () => void {
  return installLegacyRunJSStudioClient(api);
}
