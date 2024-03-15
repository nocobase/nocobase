import { useFieldSchema } from '@formily/react';
import { useMemo } from 'react';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { ButtonEditor } from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingOpenModeSchemaItems } from '../../../schema-items';
import { SchemaSettingsLinkageRules, SchemaSettingsEnableChildCollections } from '../../../schema-settings';

export const addChildActionSettings = new SchemaSettings({
  name: 'actionSettings:addChild',
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
      name: 'openMode',
      Component: SchemaSettingOpenModeSchemaItems,
      componentProps: {
        openMode: true,
        openSize: true,
      },
    },
    {
      name: 'enableChildCollections',
      Component: SchemaSettingsEnableChildCollections,
      useVisible() {
        const { name } = useCollection_deprecated();
        const { getChildrenCollections } = useCollectionManager_deprecated();
        const isChildCollectionAction = useMemo(
          () => getChildrenCollections(name).length > 0,
          [getChildrenCollections, name],
        );
        return isChildCollectionAction;
      },
      useComponentProps() {
        const { name } = useCollection_deprecated();
        return {
          collectionName: name,
        };
      },
    },
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});
