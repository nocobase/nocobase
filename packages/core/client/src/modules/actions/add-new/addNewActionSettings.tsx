/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useMemo } from 'react';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { ButtonEditor, RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingOpenModeSchemaItems } from '../../../schema-items';
import { SchemaSettingsEnableChildCollections } from '../../../schema-settings/SchemaSettings';
import { useOpenModeContext } from '../../popup/OpenModeProvider';
import { SchemaSettingsLinkageRules } from '../../../schema-settings';
import { useDataBlockProps } from '../../../data-source';

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
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
        };
      },
    },
    {
      name: 'openMode',
      Component: SchemaSettingOpenModeSchemaItems,
      useComponentProps() {
        const { hideOpenMode } = useOpenModeContext();
        return {
          openMode: !hideOpenMode,
          openSize: !hideOpenMode,
        };
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
