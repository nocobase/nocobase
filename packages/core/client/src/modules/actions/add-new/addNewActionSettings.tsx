import { useMemo } from 'react';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { ButtonEditor, RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingOpenModeSchemaItems } from '../../../schema-items';
import { SchemaSettingsEnableChildCollections } from '../../../schema-settings/SchemaSettings';

export const addNewActionSettings = new SchemaSettings({
  name: 'actionSettings:addNew',
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
      useComponentProps() {
        const { name } = useCollection_deprecated();
        return {
          collectionName: name,
        };
      },
      useVisible() {
        const { name } = useCollection_deprecated();
        const { getChildrenCollections } = useCollectionManager_deprecated();
        const isChildCollectionAction = useMemo(
          () => getChildrenCollections(name).length > 0,
          [getChildrenCollections, name],
        );
        return isChildCollectionAction;
      },
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
