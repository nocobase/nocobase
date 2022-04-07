import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useDesignable } from '../..';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';

export const useFilterableFields = (collectionName: string) => {
  const { getCollectionFields, getInterface } = useCollectionManager();
  const fields = getCollectionFields(collectionName);
  return fields?.filter?.((field) => {
    if (!field.interface) {
      return false;
    }
    const fieldInterface = getInterface(field.interface);
    if (!fieldInterface.filterable) {
      return false;
    }
    return true;
  });
};

export const FilterActionDesigner = (props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { name } = useCollection();
  const fields = useFilterableFields(name);
  const fieldNames = fieldSchema?.['x-component-props']?.fieldNames || [];
  return (
    <GeneralSchemaDesigner {...props}>
      <SchemaSettings.ItemGroup title={'可筛选字段'}>
        {fields.map((field) => {
          const checked = fieldNames.includes(field.name);
          return (
            <SchemaSettings.SwitchItem
              checked={checked}
              title={field?.uiSchema?.title}
              onChange={(value) => {
                fieldSchema['x-component-props'] = fieldSchema?.['x-component-props'] || {};
                const fieldNames = fieldSchema?.['x-component-props']?.fieldNames || [];
                console.log('fieldNames.checked', value)
                if (value) {
                  fieldNames.push(field.name);
                } else {
                  const index = fieldNames.indexOf(field.name);
                  fieldNames.splice(index, 1);
                }
                fieldSchema['x-component-props'].fieldNames = fieldNames;
                dn.emit('patch', {
                  schema: {
                    ['x-uid']: fieldSchema['x-uid'],
                    'x-component-props': {
                      ...fieldSchema['x-component-props'],
                    },
                  },
                });
                dn.refresh();
              }}
            />
          );
        })}
      </SchemaSettings.ItemGroup>
      <SchemaSettings.Divider />
      <SchemaSettings.ModalItem
        title={'编辑'}
        schema={
          {
            type: 'object',
            title: '编辑按钮',
            properties: {
              title: {
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                title: '按钮标题',
                default: fieldSchema.title,
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
              icon: {
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                title: '按钮图标',
                default: fieldSchema?.['x-component-props']?.icon,
                'x-component-props': {},
                // description: `原字段标题：${collectionField?.uiSchema?.title}`,
              },
            },
          } as ISchema
        }
        onSubmit={({ title, icon }) => {
          if (title) {
            fieldSchema.title = title;
            field.title = title;
            field.componentProps.icon = icon;
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props'].icon = icon;
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
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={(s) => {
          return s['x-component'] === 'Space' || s['x-component'] === 'ActionBar';
        }}
      />
    </GeneralSchemaDesigner>
  );
};
