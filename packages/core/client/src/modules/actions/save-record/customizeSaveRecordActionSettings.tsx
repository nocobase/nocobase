import { useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import {
  AfterSuccess,
  AssignedFieldValues,
  ButtonEditor,
  RemoveButton,
  SecondConFirm,
  SkipValidation,
  WorkflowConfig,
} from '../../../schema-component/antd/action/Action.Designer';

export const customizeSaveRecordActionSettings = new SchemaSettings({
  name: 'actionSettings:saveRecord',
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
});
