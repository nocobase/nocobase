/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import {
  ButtonEditor,
  RemoveButton,
  SecondConFirm,
  RefreshDataBlockRequest,
} from '../../../schema-component/antd/action/Action.Designer';
import { SchemaSettingsLinkageRules } from '../../../schema-settings';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import { useDataBlockProps } from '../../../data-source';

export const bulkDeleteActionSettings = new SchemaSettings({
  name: 'actionSettings:bulkDelete',
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
      name: 'secondConFirm',
      Component: SecondConFirm,
    },
    {
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: false,
        };
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { association } = useDataBlockProps() || {};
        const { getCollectionField } = useCollectionManager_deprecated();
        const associationField = getCollectionField(association);
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: associationField?.collectionName,
        };
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
