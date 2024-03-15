import { Plugin, SchemaInitializerItemType } from '@nocobase/client';
import WorkflowPlugin, {
  useRecordTriggerWorkflowsActionProps,
  useTriggerWorkflowsActionProps,
} from '@nocobase/plugin-workflow/client';

import ActionTrigger from './ActionTrigger';

const submitToWorkflowActionInitializer: SchemaInitializerItemType = {
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
      // assignedValues: {},
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

const recordTriggerWorkflowActionInitializer: SchemaInitializerItemType = {
  name: 'submitToWorkflow',
  title: '{{t("Submit to workflow", { ns: "workflow" })}}',
  Component: 'CustomizeActionInitializer',
  schema: {
    title: '{{t("Submit to workflow", { ns: "workflow" })}}',
    'x-component': 'Action',
    'x-component-props': {
      useProps: '{{ useRecordTriggerWorkflowsActionProps }}',
    },
    'x-designer': 'Action.Designer',
    'x-action-settings': {
      // assignedValues: {},
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

const recordTriggerWorkflowActionLinkInitializer = {
  ...recordTriggerWorkflowActionInitializer,
  schema: {
    ...recordTriggerWorkflowActionInitializer.schema,
    'x-component': 'Action.Link',
  },
};

export default class extends Plugin {
  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerTrigger('action', ActionTrigger);

    this.app.addScopes({
      useTriggerWorkflowsActionProps,
      useRecordTriggerWorkflowsActionProps,
    });

    const FormActionInitializers = this.app.schemaInitializerManager.get('FormActionInitializers');
    FormActionInitializers.add('customize.submitToWorkflow', submitToWorkflowActionInitializer);

    const CreateFormActionInitializers = this.app.schemaInitializerManager.get('createForm:configureActions');
    CreateFormActionInitializers.add('customize.submitToWorkflow', submitToWorkflowActionInitializer);

    const UpdateFormActionInitializers = this.app.schemaInitializerManager.get('editForm:configureActions');
    UpdateFormActionInitializers.add('customize.submitToWorkflow', submitToWorkflowActionInitializer);

    const DetailsActionInitializers = this.app.schemaInitializerManager.get('detailsWithPaging:configureActions');
    DetailsActionInitializers.add('customize.submitToWorkflow', recordTriggerWorkflowActionInitializer);

    const ReadPrettyFormActionInitializers = this.app.schemaInitializerManager.get('details:configureActions');
    ReadPrettyFormActionInitializers.add('customize.submitToWorkflow', recordTriggerWorkflowActionInitializer);

    const TableActionColumnInitializers = this.app.schemaInitializerManager.get('table:configureItemActions');
    TableActionColumnInitializers.add('customize.submitToWorkflow', recordTriggerWorkflowActionLinkInitializer);

    const GridCardItemActionInitializers = this.app.schemaInitializerManager.get('gridCard:configureItemActions');
    GridCardItemActionInitializers.add('customize.submitToWorkflow', recordTriggerWorkflowActionLinkInitializer);

    const ListItemActionInitializers = this.app.schemaInitializerManager.get('list:configureItemActions');
    ListItemActionInitializers.add('customize.submitToWorkflow', recordTriggerWorkflowActionLinkInitializer);
  }
}
