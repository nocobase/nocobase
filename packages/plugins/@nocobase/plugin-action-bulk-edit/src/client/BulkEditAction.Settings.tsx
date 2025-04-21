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
  ActionDesigner,
  SchemaInitializerOpenModeSchemaItems,
  SchemaSettings,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  useDesignable,
  useOpenModeContext,
  useSchemaToolbar,
  SecondConFirm,
  AfterSuccess,
  RefreshDataBlockRequest,
  SchemaSettingsLinkageRules,
  useDataBlockProps,
} from '@nocobase/client';
import { ModalProps } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

function UpdateMode() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();

  return (
    <SchemaSettingsSelectItem
      title={t('Data will be updated')}
      options={[
        { label: t('Selected'), value: 'selected' },
        { label: t('Entire collection', { ns: 'action-bulk-edit' }), value: 'all' },
      ]}
      value={fieldSchema?.['x-action-settings']?.['updateMode']}
      onChange={(value) => {
        fieldSchema['x-action-settings']['updateMode'] = value;
        dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-action-settings': fieldSchema['x-action-settings'],
          },
        });
        dn.refresh();
      }}
    />
  );
}

function RemoveButton(
  props: {
    onConfirmOk?: ModalProps['onOk'];
  } = {},
) {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const isDeletable = fieldSchema?.parent['x-component'] === 'CollectionField';
  return (
    !isDeletable && (
      <>
        <SchemaSettingsDivider />
        <SchemaSettingsRemove
          removeParentsIfNoChildren
          breakRemoveOn={(s) => {
            return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
          }}
          confirm={{
            title: t('Delete action'),
            onOk: props.onConfirmOk,
          }}
        />
      </>
    )
  );
}

/**
 * @deprecated
 * 之所以还保留，仅是为了兼容旧版 schema
 */
export const deprecatedBulkEditActionSettings = new SchemaSettings({
  name: 'ActionSettings:customize:bulkEdit',
  items: [
    {
      name: 'editButton',
      Component: ActionDesigner.ButtonEditor,
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
      Component: SchemaInitializerOpenModeSchemaItems,
      useComponentProps() {
        const fieldSchema = useFieldSchema();
        const isPopupAction = ['create', 'update', 'view', 'customize:popup', 'duplicate', 'customize:create'].includes(
          fieldSchema['x-action'] || '',
        );

        return {
          openMode: isPopupAction,
          openSize: isPopupAction,
        };
      },
    },
    {
      name: 'updateMode',
      Component: UpdateMode,
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

export const bulkEditActionSettings = new SchemaSettings({
  name: 'actionSettings:bulkEdit',
  items: [
    {
      name: 'editButton',
      Component: ActionDesigner.ButtonEditor,
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
      Component: SchemaInitializerOpenModeSchemaItems,
      useComponentProps() {
        const { hideOpenMode } = useOpenModeContext();
        const fieldSchema = useFieldSchema();
        const isPopupAction = ['create', 'update', 'view', 'customize:popup', 'duplicate', 'customize:create'].includes(
          fieldSchema['x-action'] || '',
        );

        return {
          openMode: isPopupAction && !hideOpenMode,
          openSize: isPopupAction && !hideOpenMode,
        };
      },
    },
    {
      name: 'updateMode',
      Component: UpdateMode,
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
/**
 * 批量编辑表单的submit 按钮
 */
export const bulkEditFormSubmitActionSettings = new SchemaSettings({
  name: 'actionSettings:bulkEditSubmit',
  items: [
    {
      name: 'editButton',
      Component: ActionDesigner.ButtonEditor,
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
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
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
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: true,
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
