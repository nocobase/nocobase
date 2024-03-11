import { useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { isInitializersSame, useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import {
  ButtonEditor,
  RemoveButton,
  SecondConFirm,
  WorkflowConfig,
} from '../../../schema-component/antd/action/Action.Designer';
import { SaveMode } from './createSubmitActionSettings';

export const updateSubmitActionSettings = new SchemaSettings({
  name: 'actionSettings:updateSubmit',
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
      name: 'saveMode',
      Component: SaveMode,
      useVisible() {
        const fieldSchema = useFieldSchema();
        return (
          fieldSchema['x-action'] === 'submit' &&
          isInitializersSame(fieldSchema.parent?.['x-initializer'], 'createForm:configureActions')
        );
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
