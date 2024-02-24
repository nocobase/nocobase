import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated } from '../../../collection-manager';
import {
  AfterSuccess,
  AssignedFieldValues,
  ButtonEditor,
  RemoveButton,
  SecondConFirm,
} from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingsLinkageRules } from '../../../schema-settings';

export const customizeUpdateRecordActionSettings = new SchemaSettings({
  name: 'actionSettings:updateRecord',
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
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection_deprecated();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'secondConFirm',
      Component: SecondConFirm,
    },
    {
      name: 'assignFieldValues',
      Component: AssignedFieldValues,
    },
    {
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
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
