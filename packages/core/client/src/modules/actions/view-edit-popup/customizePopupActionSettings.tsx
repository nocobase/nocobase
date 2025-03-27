/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { isEmpty } from 'lodash';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { useCollection, useDataBlockProps } from '../../../data-source';
import { ButtonEditor, RemoveButton } from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingOpenModeSchemaItems } from '../../../schema-items';
import { SchemaSettingsLinkageRules, SchemaSettingAccessControl } from '../../../schema-settings';
import { useOpenModeContext } from '../../popup/OpenModeProvider';
import { useCurrentPopupRecord } from '../../variable/variablesProvider/VariablePopupRecordProvider';
import { useCollectionRecord } from '../../../';

export const customizePopupActionSettings = new SchemaSettings({
  name: 'actionSettings:popup',
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
        const { association } = useDataBlockProps() || {};
        const { getCollectionField } = useCollectionManager_deprecated();
        const associationField = getCollectionField(association);
        return {
          ...linkageRulesProps,
          collectionName: associationField?.collectionName || name,
        };
      },
      useVisible() {
        const { collection } = useCurrentPopupRecord() || {};
        const currentCollection = useCollection();
        const record = useCollectionRecord();
        const { association } = useDataBlockProps() || {};
        return (
          (!isEmpty(record?.data) && (!collection || collection?.name === currentCollection?.name)) || !!association
        );
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
    SchemaSettingAccessControl,
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
