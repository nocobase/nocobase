import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useCompile, useDesignable } from '../../hooks';

const useLabelFields = (collectionName?: any) => {
  if (!collectionName) {
    return [];
  }
  const compile = useCompile();
  const { getCollectionFields } = useCollectionManager();
  const targetFields = getCollectionFields(collectionName);
  return targetFields
    ?.filter?.((field) => field?.interface && !field?.target && field.type !== 'boolean')
    ?.map?.((field) => {
      return {
        value: field.name,
        label: compile(field?.uiSchema?.title || field.name),
      };
    });
};

export const TableColumnDesigner = (props) => {
  const { uiSchema, fieldSchema, collectionField } = props;
  const { getInterface } = useCollectionManager();
  const field = useField();
  const { t } = useTranslation();
  const columnSchema = useFieldSchema();
  const { dn } = useDesignable();
  const fieldNames =
    fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
  const options = useLabelFields(collectionField?.target);
  const intefaceCfg = getInterface(collectionField?.interface);
  
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettings.ModalItem
        title={t('Custom column title')}
        schema={
          {
            type: 'object',
            title: t('Custom column title'),
            properties: {
              title: {
                // title: t('Column title'),
                default: columnSchema?.title,
                description: `${t('Original title: ')}${collectionField?.uiSchema?.title || fieldSchema?.title}`,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        onSubmit={({ title }) => {
          if (title) {
            field.title = title;
            columnSchema.title = title;
            dn.emit('patch', {
              schema: {
                'x-uid': columnSchema['x-uid'],
                title: columnSchema.title,
              },
            });
          }
          dn.refresh();
        }}
      />
      {
        intefaceCfg && intefaceCfg.sortable === true && (
          <SchemaSettings.SwitchItem
            title={t('Sortable')}
            checked={field.componentProps.sorter}
            onChange={(v) => {
              const schema: ISchema = {
                ['x-uid']: columnSchema['x-uid'],
              };
              columnSchema['x-component-props'] = {
                ...columnSchema['x-component-props'],
                sorter: v
              }
              schema['x-component-props'] = columnSchema['x-component-props'];
              field.componentProps.sorter = v;
              dn.emit('patch', {
                schema
              });
              dn.refresh();
            }}
          />
        )
      }
      {['linkTo', 'm2m', 'm2o', 'o2m', 'obo', 'oho'].includes(collectionField?.interface) && (
        <SchemaSettings.SelectItem
          title={t('Title field')}
          options={options}
          value={fieldNames?.['label']}
          onChange={(label) => {
            const fieldNames = {
              ...fieldSchema['x-component-props']['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            field.query(`.*.${fieldSchema.name}`).take((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          }}
        />
      )}
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
        confirm={{
          title: t('Delete table column'),
        }}
      />
    </GeneralSchemaDesigner>
  );
};
