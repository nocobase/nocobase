import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import Manual from './instruction';

import { NAMESPACE } from '../locale';
import { WorkflowTodo } from './WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './WorkflowTodoBlockInitializer';
import {
  addActionButton,
  addActionButton_deprecated,
  addBlockButton,
  addBlockButton_deprecated,
} from './instruction/SchemaConfig';
import { addCustomFormField, addCustomFormField_deprecated } from './instruction/forms/custom';

export default class extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  // You can get and modify the app instance here
  async load() {
    this.addComponents();

    // this.app.addProvider(Provider);
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerInstruction('manual', Manual);

    this.app.schemaInitializerManager.add(addBlockButton_deprecated);
    this.app.schemaInitializerManager.add(addBlockButton);
    this.app.schemaInitializerManager.add(addActionButton_deprecated);
    this.app.schemaInitializerManager.add(addActionButton);
    this.app.schemaInitializerManager.add(addCustomFormField_deprecated);
    this.app.schemaInitializerManager.add(addCustomFormField);

    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
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
