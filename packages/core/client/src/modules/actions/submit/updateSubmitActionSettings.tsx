/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import { isInitializersSame, useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import {
  AfterSuccess,
  AssignedFieldValues,
  ButtonEditor,
  RefreshDataBlockRequest,
  RemoveButton,
  SecondConFirm,
  SkipValidation,
} from '../../../schema-component/antd/action/Action.Designer';
import { SaveMode } from './createSubmitActionSettings';
import { SchemaSettingsLinkageRules } from '../../../schema-settings';
import { useCollection_deprecated } from '../../../collection-manager';

export const updateSubmitActionSettings = new SchemaSettings({
  name: 'actionSettings:updateSubmit',
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
      name: 'secondConfirmation',
      Component: SecondConFirm,
    },
    {
      name: 'assignFieldValues',
      Component: AssignedFieldValues,
      useVisible() {
        const fieldSchema = useFieldSchema();
        return !fieldSchema.parent['x-initializer'].includes('bulkEditForm');
      },
    },
    {
      name: 'skipRequiredValidation',
      Component: SkipValidation,
      useVisible() {
        const fieldSchema = useFieldSchema();
        return !fieldSchema.parent['x-initializer'].includes('bulkEditForm');
      },
    },
    {
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
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

export const submitActionSettings = new SchemaSettings({
  name: 'actionSettings:submit',
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
      name: 'secondConfirmation',
      Component: SecondConFirm,
    },
    {
      name: 'saveMode',
      Component: SaveMode,
      useVisible() {
        const fieldSchema = useFieldSchema();
        return (
          fieldSchema['x-action'] === 'submit' &&
          isInitializersSame(fieldSchema.parent?.['x-initializer'], 'createForm:configureActions')
        );
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
