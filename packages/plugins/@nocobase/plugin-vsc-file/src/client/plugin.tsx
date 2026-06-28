/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Plugin } from '@nocobase/client';

import { LegacyRunJSEditorRegistry } from './runjs-studio/contract';

export class PluginVscFileClient extends Plugin {
  async load() {
    const { legacyRunJSStudioProvider } = await import('./runjs-studio/LegacyRunJSStudioProvider');

    LegacyRunJSEditorRegistry.registerProvider(legacyRunJSStudioProvider);
  }
}

export default PluginVscFileClient;
