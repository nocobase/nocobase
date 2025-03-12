/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import {
  AfterSuccess,
  ButtonEditor,
  RefreshDataBlockRequest,
  RemoveButton,
  SchemaSettings,
  SchemaSettingsLinkageRules,
  SecondConFirm,
  useCollection,
  useCollectionRecord,
  useSchemaToolbar,
  SchemaSettingAccessControl,
} from '@nocobase/client';
import { CustomRequestSettingsItem } from './components/CustomRequestActionDesigner';

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
        const { name } = useCollection() || {};
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
      useVisible() {
        const record = useCollectionRecord();
        return record && record.data && !record?.isNew;
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
      ...SchemaSettingAccessControl,
      useVisible() {
        return true;
      },
    },
    {
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: false,
        };
      },
      useVisible() {
        const collection = useCollection();
        return !!collection;
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
