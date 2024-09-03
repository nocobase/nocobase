/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AfterSuccess,
  ButtonEditor,
  RemoveButton,
  SchemaSettings,
  SchemaSettingsLinkageRules,
  SecondConFirm,
  useCollection,
  useSchemaToolbar,
  RefreshDataBlockRequest,
  useCollectionRecord,
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
        const { name } = useCollection() || {};
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
      useVisible() {
        const record = useCollectionRecord();
        return !record?.isNew;
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
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: false,
        };
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
