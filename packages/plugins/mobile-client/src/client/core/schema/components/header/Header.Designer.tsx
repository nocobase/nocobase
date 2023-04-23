import { Schema, useField, useFieldSchema } from '@formily/react';
import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '@nocobase/client';
import React from 'react';
import { Switch } from 'react-router-dom';
import { useTranslation } from '../../../../locale';
import { useSchemaPatch } from '../../hooks';

const findGridSchema = (schema: Schema) => {
  const gridSchema = schema.reduceProperties(
    (schema, next) => schema || (next['x-component'] === 'Grid' && next),
  ) as Schema;
  return gridSchema;
};

export const HeaderDesigner = () => {
  const field = useField();
  const { onUpdateComponentProps } = useSchemaPatch();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const tabsSchema = fieldSchema.parent?.properties?.['tabs'];
  return (
    <GeneralSchemaDesigner draggable={false}>
      <SchemaSettings.ModalItem
        title={t('Edit header info')}
        components={{ Switch }}
        initialValues={field.componentProps}
        schema={{
          properties: {
            title: {
              type: 'string',
              title: t('Menu header title'),
              required: true,
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
            showBack: {
              type: 'boolean',
              title: t('Show back button'),
              'x-component': 'Switch',
              'x-decorator': 'FormItem',
            },
          },
        }}
        onSubmit={onUpdateComponentProps}
      />
      <SchemaSettings.SwitchItem
        checked={!!tabsSchema}
        title={t('Enable Tabs')}
        onChange={async (v) => {
          if (v) {
            const gridSchema = findGridSchema(fieldSchema.parent);
            await dn.remove(gridSchema);
            await dn.insertAfterEnd({
              type: 'void',
              name: 'tabs',
              'x-component': 'Tabs',
              'x-component-props': {},
              'x-initializer': 'TabPaneInitializers',
              'x-initializer-props': {
                gridInitializer: 'MBlockInitializers',
              },
              properties: {
                tab1: {
                  type: 'void',
                  title: '{{t("Untitled")}}',
                  'x-component': 'Tabs.TabPane',
                  'x-designer': 'Tabs.Designer',
                  'x-component-props': {},
                  properties: {
                    grid: gridSchema,
                  },
                },
              },
            });
          } else {
            const gridSchema = findGridSchema(tabsSchema.properties[Object.keys(tabsSchema.properties)[0]]);
            await dn.remove(tabsSchema);
            await dn.insertAfterEnd(gridSchema, {
              onSuccess() {
                // history.push('../');
              },
            });
          }
        }}
      />
    </GeneralSchemaDesigner>
  );
};
