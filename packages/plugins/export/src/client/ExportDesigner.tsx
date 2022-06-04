import type { ISchema } from '@formily/react';
import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  SchemaSettings,
  useCollection,
  useDesignable,
  useResourceActionContext,
} from '@nocobase/client';
import { uid } from '@nocobase/utils';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const ExportDesigner = () => {
  const { name, title } = useCollection();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const ctx = useResourceActionContext();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.request?.params?.filter || {};
  const [initialSchema, setInitialSchema] = useState<ISchema>();

  useEffect(() => {
    const schemaUid = uid();
    const schema: ISchema = {
      type: 'void',
      'x-uid': schemaUid,
      'x-component': 'Grid',
      'x-initializer': 'CustomFormItemInitializers',
    };
    setInitialSchema(schema);
  }, [field.address]);

  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettings.ModalItem
        title={t('Edit button')}
        schema={
          {
            type: 'object',
            title: t('Edit button'),
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: t('Button title'),
                default: fieldSchema.title,
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
              icon: {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: t('Button icon'),
                default: fieldSchema?.['x-component-props']?.icon,
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
              type: {
                'x-decorator': 'FormItem',
                'x-component': 'Radio.Group',
                title: t('Button background color'),
                default: fieldSchema?.['x-component-props']?.danger
                  ? 'danger'
                  : fieldSchema?.['x-component-props']?.type === 'primary'
                  ? 'primary'
                  : 'default',
                enum: [
                  { value: 'default', label: '{{t("Default")}}' },
                  { value: 'primary', label: '{{t("Highlight")}}' },
                  { value: 'danger', label: '{{t("Danger red")}}' },
                ],
              },
            },
          } as ISchema
        }
        onSubmit={({ title, icon, type }) => {
          if (title) {
            fieldSchema.title = title;
            field.title = title;
            field.componentProps.icon = icon;
            field.componentProps.danger = type === 'danger';
            field.componentProps.type = type;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].icon = icon;
            fieldSchema['x-component-props'].danger = type === 'danger';
            fieldSchema['x-component-props'].type = type;
            dn.emit('patch', {
              schema: {
                ['x-uid']: fieldSchema['x-uid'],
                title,
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          }
        }}
      />
      <SchemaSettings.ActionModalItem
        title={t('Export fields')}
        initialSchema={initialSchema}
        initialValues={fieldSchema?.['x-action-settings']?.export?.value}
        uid={fieldSchema?.['x-action-settings']?.schemaUid}
        onSubmit={(value) => {
          fieldSchema['x-action-settings']['export'] = value;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-action-settings': fieldSchema['x-action-settings'],
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={(s) => {
          return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
        }}
        confirm={{
          title: t('Delete action'),
        }}
      />
    </GeneralSchemaDesigner>
  );
};
