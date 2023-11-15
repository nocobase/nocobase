import React from 'react';
import {
  useApp,
  GeneralSchemaDesigner,
  SchemaSetting,
  SchemaSettings,
  useCompile,
  ActionDesigner,
  useSchemaDesigner,
  useDesignable,
  SchemaInitializerOpenModeSchemaItems,
} from '@nocobase/client';
import { ModalProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useField, useFieldSchema } from '@formily/react';
import { useBulkEditTranslation } from './locale';

function UpdateMode() {
  const { dn } = useDesignable();
  const { t } = useBulkEditTranslation();
  const fieldSchema = useFieldSchema();

  return (
    <SchemaSettings.SelectItem
      title={t('Data will be updated')}
      options={[
        { label: t('Selected'), value: 'selected' },
        { label: t('All'), value: 'all' },
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
        <SchemaSettings.Divider />
        <SchemaSettings.Remove
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
const bulkEditactionSettings = new SchemaSetting({
  name: 'ActionSettings:bulk:edit',
  items: [
    {
      name: 'Customize',
      Component: SchemaSettings.ItemGroup,
      useComponentProps() {
        const { t } = useBulkEditTranslation();
        const fieldSchema = useFieldSchema();
        const compile = useCompile();
        const actionTitle = fieldSchema.title ? compile(fieldSchema.title) : '';
        return {
          title: `${t('Customize')} > ${actionTitle}`,
        };
      },
      type: 'itemGroup',
      children: [
        {
          name: 'editButton',
          Component: ActionDesigner.ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaDesigner();
            return buttonEditorProps;
          },
        },
        {
          name: 'openMode',
          Component: SchemaInitializerOpenModeSchemaItems,
          useComponentProps() {
            const fieldSchema = useFieldSchema();
            const isPopupAction = [
              'create',
              'update',
              'view',
              'customize:popup',
              'duplicate',
              'customize:create',
            ].includes(fieldSchema['x-action'] || '');

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
          name: 'remove',
          sort: 100,
          Component: RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaDesigner();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

const BulkEditActionSetting = () => {
  const filed = useField;
  const app = useApp();
  const settingsName = `ActionSettings:${filed['x-action']}`;
  const defaultActionSettings = 'ActionSettings';
  const hasAction = app.schemaSettingsManager.has(settingsName);

  return <GeneralSchemaDesigner schemaSettings={hasAction ? settingsName : defaultActionSettings} />;
};

export { BulkEditActionSetting, bulkEditactionSettings };
