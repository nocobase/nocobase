/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useFieldSchema } from '@formily/react';
import { isValid } from '@formily/shared';
import {
  ActionDesigner,
  SchemaSettings,
  SchemaSettingsItemType,
  SchemaSettingsModalItem,
  SchemaSettingsSelectItem,
  AssignedFieldValues,
  useDesignable,
  useSchemaToolbar,
  RefreshDataBlockRequest,
  AfterSuccess,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import React from 'react';

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

const schemaSettingsItems: SchemaSettingsItemType[] = [
  {
    name: 'editButton',
    Component: ActionDesigner.ButtonEditor,
    useComponentProps() {
      const { buttonEditorProps } = useSchemaToolbar();
      return buttonEditorProps;
    },
  },
  {
    name: 'updateMode',
    Component: UpdateMode,
    useVisible() {
      const fieldSchema = useFieldSchema();
      const isUpdateModePopupAction = ['customize:bulkUpdate', 'customize:bulkEdit'].includes(fieldSchema['x-action']);
      return isUpdateModePopupAction;
    },
  },
  {
    name: 'assignFieldValues',
    Component: AssignedFieldValues,
  },
  {
    name: 'afterSuccess',
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
    Component: ActionDesigner.RemoveButton as any,
    useComponentProps() {
      const { removeButtonProps } = useSchemaToolbar();
      return removeButtonProps;
    },
  },
];

/**
 * @deprecated
 * 用于兼容之前版本的 name
 */
const deprecatedBulkUpdateActionSettings = new SchemaSettings({
  name: 'ActionSettings:customize:bulkUpdate',
  items: schemaSettingsItems,
});

const bulkUpdateActionSettings = new SchemaSettings({
  name: 'actionSettings:bulkUpdate',
  items: schemaSettingsItems,
});

export { bulkUpdateActionSettings, deprecatedBulkUpdateActionSettings };
