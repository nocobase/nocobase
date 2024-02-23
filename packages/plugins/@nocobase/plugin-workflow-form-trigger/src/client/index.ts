import { Plugin, SchemaInitializerItemType } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import FormTrigger from './FormTrigger';

// TODO(refactor): should be moved to workflow plugin
const formTriggerWorkflowActionInitializer: SchemaInitializerItemType = {
  name: 'submitToWorkflow',
  title: '{{t("Submit to workflow", { ns: "workflow" })}}',
  Component: 'CustomizeActionInitializer',
  schema: {
    title: '{{t("Submit to workflow", { ns: "workflow" })}}',
    'x-component': 'Action',
    'x-component-props': {
      useProps: '{{ useTriggerWorkflowsActionProps }}',
    },
    'x-designer': 'Action.Designer',
    'x-action-settings': {
      assignedValues: {},
      skipValidator: false,
      onSuccess: {
        manualClose: true,
        redirecting: false,
        successMessage: '{{t("Submitted successfully")}}',
      },
      triggerWorkflows: [],
    },
    'x-action': 'customize:triggerWorkflows',
  },
};

export default class extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerTrigger('form', FormTrigger);

    const FormActionInitializers = this.app.schemaInitializerManager.get('FormActionInitializers');
    FormActionInitializers.add('customize.submitToWorkflow', formTriggerWorkflowActionInitializer);

    const CreateFormActionInitializers = this.app.schemaInitializerManager.get('CreateFormActionInitializers');
    CreateFormActionInitializers.add('customize.submitToWorkflow', formTriggerWorkflowActionInitializer);

    const UpdateFormActionInitializers = this.app.schemaInitializerManager.get('UpdateFormActionInitializers');
    UpdateFormActionInitializers.add('customize.submitToWorkflow', formTriggerWorkflowActionInitializer);

    const DetailsActionInitializers = this.app.schemaInitializerManager.get('DetailsActionInitializers');
    DetailsActionInitializers.add('customize.submitToWorkflow', formTriggerWorkflowActionInitializer);

    const ReadPrettyFormActionInitializers = this.app.schemaInitializerManager.get('ReadPrettyFormActionInitializers');
    ReadPrettyFormActionInitializers.add('customize.submitToWorkflow', formTriggerWorkflowActionInitializer);

    const TableActionColumnInitializers = this.app.schemaInitializerManager.get('TableActionColumnInitializers');
    TableActionColumnInitializers.add('customize.submitToWorkflow', formTriggerWorkflowActionInitializer);

    const GridCardItemActionInitializers = this.app.schemaInitializerManager.get('GridCardItemActionInitializers');
    GridCardItemActionInitializers.add('customize.submitToWorkflow', formTriggerWorkflowActionInitializer);

    const ListItemActionInitializers = this.app.schemaInitializerManager.get('ListItemActionInitializers');
    ListItemActionInitializers.add('customize.submitToWorkflow', formTriggerWorkflowActionInitializer);
  }
}
