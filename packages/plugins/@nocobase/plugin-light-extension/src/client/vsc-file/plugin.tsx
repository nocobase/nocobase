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
import { installRunJSStudioClientV2 } from '../../client-v2/vsc-file/plugin';

export function installLegacyRunJSStudioClient() {
  const disposeClientV2 = installRunJSStudioClientV2();
  const disposeLegacy = LegacyRunJSEditorRegistry.registerProvider(legacyRunJSStudioProvider);

  return () => {
    disposeLegacy();
    disposeClientV2();
  };
}
