import { BlockInitializers, Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import Manual from './instruction';

import { WorkflowTodo } from './WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './WorkflowTodoBlockInitializer';
import { NAMESPACE } from '../locale';

export default class extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  // You can get and modify the app instance here
  async load() {
    // this.app.addProvider(Provider);
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.instructions.register(Manual.type, Manual);

    // TODO(optimize): change to register way
    const initializerGroup = BlockInitializers.items.find((group) => group.key === 'media');
    if (!initializerGroup.children.find((item) => item.key === 'workflowTodos')) {
      initializerGroup.children.push({
        key: 'workflowTodos',
        type: 'item',
        title: `{{t("Workflow todos", { ns: "${NAMESPACE}" })}}`,
        component: 'WorkflowTodoBlockInitializer',
        icon: 'CheckSquareOutlined',
      } as any);
    }
  }

  addComponents() {
    this.app.addComponents({
      WorkflowTodo,
      WorkflowTodoBlockInitializer,
    });
  }
}
