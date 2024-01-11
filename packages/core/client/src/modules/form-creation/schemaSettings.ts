import { useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { useSchemaToolbar } from '../../application';
import { SchemaSettings } from '../../application/schema-settings/SchemaSettings';
import { useFormBlockContext } from '../../block-provider';
import { useCollection } from '../../collection-manager';
import {
  AfterSuccess,
  AssignedFieldValues,
  ButtonEditor,
  RemoveButton,
  SecondConFirm,
  SkipValidation,
  WorkflowConfig,
} from '../../schema-component/antd/action/Action.Designer';
import {
  SchemaSettingsBlockTitleItem,
  SchemaSettingsDataTemplates,
  SchemaSettingsFormItemTemplate,
  SchemaSettingsLinkageRules,
} from '../../schema-settings';

export const creationFormBlockSettings = new SchemaSettings({
  name: 'creationFormBlockSettings',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        return {
          collectionName: name,
        };
      },
    },
    {
      name: 'dataTemplates',
      Component: SchemaSettingsDataTemplates,
      useVisible() {
        const { action } = useFormBlockContext();
        return !action;
      },
      useComponentProps() {
        const { name } = useCollection();
        return {
          collectionName: name,
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'formItemTemplate',
      Component: SchemaSettingsFormItemTemplate,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
        return {
          componentName: 'FormItem',
          collectionName: name,
          resourceName: defaultResource,
        };
      },
    },
    {
      name: 'divider2',
      type: 'divider',
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});

export const submitActionSettings = new SchemaSettings({
  name: 'actionSettings:submit',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'secondConfirmation',
      Component: SecondConFirm,
    },
    {
      name: 'workflowConfig',
      Component: WorkflowConfig,
      useVisible() {
        const fieldSchema = useFieldSchema();
        return isValid(fieldSchema?.['x-action-settings']?.triggerWorkflows);
      },
    },
    {
      name: 'remove',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});

export const customizeSaveRecordActionSettings = new SchemaSettings({
  name: 'actionSettings:customize:saveRecord',
  items: [
    {
      name: 'title',
      type: 'itemGroup',
      componentProps: {
        title: 'Customize > Save record',
      },
      children: [
        {
          name: 'editButton',
          Component: ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaToolbar();
            return buttonEditorProps;
          },
        },
        {
          name: 'secondConfirmation',
          Component: SecondConFirm,
        },
        {
          name: 'assignFieldValues',
          Component: AssignedFieldValues,
        },
        {
          name: 'skipRequiredValidation',
          Component: SkipValidation,
        },
        {
          name: 'afterSuccessfulSubmission',
          Component: AfterSuccess,
          useVisible() {
            const fieldSchema = useFieldSchema();
            return isValid(fieldSchema?.['x-action-settings']?.onSuccess);
          },
        },
        {
          name: 'bindWorkflow',
          Component: WorkflowConfig,
        },
        {
          name: 'delete',
          sort: 100,
          Component: RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaToolbar();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

export const customizeSubmitToWorkflowActionSettings = new SchemaSettings({
  name: 'actionSettings:customize:submitToWorkflow',
  items: [
    {
      name: 'title',
      type: 'itemGroup',
      componentProps: {
        title: 'Customize > Submit to workflow',
      },
      children: [
        {
          name: 'editButton',
          Component: ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaToolbar();
            return buttonEditorProps;
          },
        },
        {
          name: 'secondConfirmation',
          Component: SecondConFirm,
        },
        {
          name: 'assignFieldValues',
          Component: AssignedFieldValues,
        },
        {
          name: 'skipRequiredValidation',
          Component: SkipValidation,
        },
        {
          name: 'afterSuccessfulSubmission',
          Component: AfterSuccess,
          useVisible() {
            const fieldSchema = useFieldSchema();
            return isValid(fieldSchema?.['x-action-settings']?.onSuccess);
          },
        },
        {
          name: 'bindWorkflow',
          Component: WorkflowConfig,
        },
        {
          name: 'delete',
          sort: 100,
          Component: RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaToolbar();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});
