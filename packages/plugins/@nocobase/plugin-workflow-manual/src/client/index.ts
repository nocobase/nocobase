import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import Manual from './instruction';

import { WorkflowTodo } from './WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './WorkflowTodoBlockInitializer';
import { NAMESPACE } from '../locale';
import { addActionButton, addBlockButton } from './instruction/SchemaConfig';
import { addCustomFormField } from './instruction/forms/custom';

export default class extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  // You can get and modify the app instance here
  async load() {
    this.addComponents();

    // this.app.addProvider(Provider);
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    const manualInstruction = new Manual();
    workflow.instructions.register(manualInstruction.type, manualInstruction);

    this.app.schemaInitializerManager.add(addBlockButton);
    this.app.schemaInitializerManager.add(addActionButton);
    this.app.schemaInitializerManager.add(addCustomFormField);

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers.add('otherBlocks.workflowTodos', {
      title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
      Component: 'WorkflowTodoBlockInitializer',
      icon: 'CheckSquareOutlined',
    });
  }

  addComponents() {
    this.app.addComponents({
      WorkflowTodo,
      WorkflowTodoBlockInitializer,
    });
  }
}
