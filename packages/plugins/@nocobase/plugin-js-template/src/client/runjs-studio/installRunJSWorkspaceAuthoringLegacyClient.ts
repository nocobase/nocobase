/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LegacyRunJSEditorRegistry } from './contract';
import { legacyRunJSStudioProvider } from './LegacyRunJSStudioProvider';
import { installRunJSWorkspaceAuthoringClientV2, type RunJSWorkspaceApiClientLike } from '../../client-v2/runjs-studio';

export function installRunJSWorkspaceAuthoringLegacyClient(api: RunJSWorkspaceApiClientLike): () => void {
  const disposeClientV2 = installRunJSWorkspaceAuthoringClientV2(api);
  let disposeLegacy: (() => void) | undefined;
  try {
    disposeLegacy = LegacyRunJSEditorRegistry.registerProvider({ ...legacyRunJSStudioProvider });
  } catch (error) {
    disposeClientV2();
    throw error;
  }

  return () => {
    disposeLegacy?.();
    disposeClientV2();
  };
}
