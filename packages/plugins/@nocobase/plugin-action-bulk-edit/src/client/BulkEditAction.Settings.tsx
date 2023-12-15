import React from 'react';
import {
  SchemaSettings,
  useCompile,
  ActionDesigner,
  useSchemaToolbar,
  useDesignable,
  SchemaInitializerOpenModeSchemaItems,
  SchemaSettingsSelectItem,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
  SchemaSettingsItemGroup,
} from '@nocobase/client';
import { ModalProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useFieldSchema } from '@formily/react';

const MenuGroup = (props) => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const compile = useCompile();
  const actionTitle = fieldSchema.title ? compile(fieldSchema.title) : '';
  return (
    <SchemaSettingsItemGroup title={`${t('Customize')} > ${actionTitle}`}>{props.children}</SchemaSettingsItemGroup>
  );
};

function UpdateMode() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();

  return (
    <SchemaSettingsSelectItem
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
const bulkEditactionSettings = new SchemaSettings({
  name: 'ActionSettings:customize:bulkEdit',
  items: [
    {
      name: 'Customize',
      Component: MenuGroup,
      children: [
        {
          name: 'editButton',
          Component: ActionDesigner.ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaToolbar();
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
            const { removeButtonProps } = useSchemaToolbar();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

export { bulkEditactionSettings };
