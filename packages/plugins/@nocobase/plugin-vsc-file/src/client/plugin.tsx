/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { Plugin } from '@nocobase/client';
import { RunJSEditorRegistry } from '@nocobase/client-v2';

import { LegacyRunJSEditorRegistry } from './runjs-studio/contract';
import { runJSStudioProvider } from '../client-v2/runjs-studio';

export class PluginVscFileClient extends Plugin {
  async load() {
    const { legacyRunJSStudioProvider } = await import('./runjs-studio/LegacyRunJSStudioProvider');

    RunJSEditorRegistry.registerProvider(runJSStudioProvider);
    LegacyRunJSEditorRegistry.registerProvider(legacyRunJSStudioProvider);
  }
}

export default PluginVscFileClient;
