import {
  AfterSuccess,
  ButtonEditor,
  RemoveButton,
  SchemaSettings,
  SchemaSettingsLinkageRules,
  SecondConFirm,
  useCollection,
  useSchemaToolbar,
} from '@nocobase/client';
import { CustomRequestACL, CustomRequestSettingsItem } from './components/CustomRequestActionDesigner';
import { useFieldSchema } from '@formily/react';

export const customizeCustomRequestActionSettings = new SchemaSettings({
  name: 'actionSettings:customRequest',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const fieldSchema = useFieldSchema();
        return {
          isLink: fieldSchema['x-action'] === 'customize:table:request',
        };
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
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
    },
    {
      name: 'request settings',
      Component: CustomRequestSettingsItem,
    },
    {
      name: 'accessControl',
      Component: CustomRequestACL,
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
