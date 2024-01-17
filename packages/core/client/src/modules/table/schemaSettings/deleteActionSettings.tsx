import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection } from '../../../collection-manager';
import { ButtonEditor, SecondConFirm } from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingsLinkageRules } from '../../../schema-settings';

export const deleteActionSettings = new SchemaSettings({
  name: 'actionSettings:delete',
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
        const { name } = useCollection();
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
      name: 'delete',
      type: 'remove',
    },
  ],
});
