/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/client-v2';
import type { PluginWorkflowClientV2 } from '@nocobase/plugin-workflow/client-v2';

import ScriptInstruction from './nodes/script';

export class PluginWorkflowJavaScriptClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    const workflow = this.app.pm.get('workflow') as PluginWorkflowClientV2 | undefined;
    workflow?.registerInstruction?.(
      'script',
      new ScriptInstruction().bindTranslate((key) => this.t(key)),
    );
  }
}

export default PluginWorkflowJavaScriptClientV2;
