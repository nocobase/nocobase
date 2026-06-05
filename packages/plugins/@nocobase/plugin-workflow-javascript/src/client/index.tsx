import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import ScriptInstruction from './ScriptInstruction';

export class PluginWorkflowScriptClient extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerInstruction('script', ScriptInstruction);
  }
}

export default PluginWorkflowScriptClient;
