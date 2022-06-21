import { css } from '@emotion/css';
import { FormItem as Item } from '@formily/antd';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile, useDesignable } from '../..';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { BlockItem } from '../block-item';
import { HTMLEncode } from '../input/shared';
import { uid } from '@formily/shared';
import { useFilterByTk } from '../../../block-provider';


const gridRowColWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

export const FormItem: any = (props) => {
  const field = useField();
  return (
    <BlockItem className={'nb-form-item'}>
      <Item
       className={`${css`& .ant-space{
        flex-wrap:wrap;
      }`}`}
        {...props}
        extra={
          field.description ? (
            <div
              dangerouslySetInnerHTML={{
                __html: HTMLEncode(field.description).split('\n').join('<br/>'),
              }}
            />
          ) : null
        }
      />
    </BlockItem>
  );
};

FormItem.Designer = (props) => {
  const { getCollectionFields, getCollection, getInterface } = useCollectionManager();
  const { getField } = useCollection();
  const tk = useFilterByTk();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn, refresh, insertAdjacent, insertBeforeBegin } = useDesignable();
  const compile = useCompile();
  const collectionField = getField(fieldSchema['name']);
  const interfaceConfig = getInterface(collectionField?.interface);
  const originalTitle = collectionField?.uiSchema?.title;
  const targetFields = collectionField?.target ? getCollectionFields(collectionField.target) : [];
  const isSubFormAssocitionField = field.address.segments.includes('__form_grid');
  const initialValue = {
    title: field.title === originalTitle ? undefined : field.title,
  };
  if (!field.readPretty) {
    initialValue['required'] = field.required;
  }
  const options = targetFields
    .filter((field) => !field?.target && field.type !== 'boolean')
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));
  console.log('f', fieldSchema, collectionField);
  return (
    <GeneralSchemaDesigner>
      {collectionField && (
        <SchemaSettings.ModalItem
          title={t('Edit field title')}
          schema={
            {
              type: 'object',
              title: t('Edit field title'),
              properties: {
                title: {
                  title: t('Field title'),
                  default: field?.title,
                  description: `${t('Original field title: ')}${collectionField?.uiSchema?.title}`,
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
              fieldSchema.title = title;
              dn.emit('patch', {
                schema: {
                  'x-uid': fieldSchema['x-uid'],
                  title: fieldSchema.title,
                },
              });
            }
            dn.refresh();
          }}
        />
      )}
      {!field.readPretty && (
        <SchemaSettings.ModalItem
          title={t('Edit description')}
          schema={
            {
              type: 'object',
              title: t('Edit description'),
              properties: {
                description: {
                  // title: t('Description'),
                  default: field?.description,
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  'x-component-props': {},
                },
              },
            } as ISchema
          }
          onSubmit={({ description }) => {
            field.description = description;
            fieldSchema.description = description;
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                description: fieldSchema.description,
              },
            });
            dn.refresh();
          }}
        />
      )}
      {field.readPretty && (
        <SchemaSettings.ModalItem
          title={t('Edit tooltip')}
          schema={
            {
              type: 'object',
              title: t('Edit description'),
              properties: {
                tooltip: {
                  default: fieldSchema?.['x-decorator-props']?.tooltip,
                  'x-decorator': 'FormItem',
                  'x-component': 'Input.TextArea',
                  'x-component-props': {},
                },
              },
            } as ISchema
          }
          onSubmit={({ tooltip }) => {
            field.decoratorProps.tooltip = tooltip;
            fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
            fieldSchema['x-decorator-props']['tooltip'] = tooltip;
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-decorator-props': fieldSchema['x-decorator-props'],
              },
            });
            dn.refresh();
          }}
        />
      )}
      {!field.readPretty && (
        <SchemaSettings.SwitchItem
          title={t('Required')}
          checked={field.required}
          onChange={(required) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            field.required = required;
            fieldSchema['required'] = required;
            schema['required'] = required;
            dn.emit('patch', {
              schema,
            });
            refresh();
          }}
        />
      )}
      {!isSubFormAssocitionField && ['o2o', 'oho', 'obo', 'o2m'].includes(collectionField?.interface) && (
        <SchemaSettings.SelectItem
          title={t('Toggles the subfield mode')}
          options={
            collectionField?.interface === 'o2m'
            ? [{ label: t('Selector mode'), value: 'CollectionField' }, { label: t('Subtable mode'), value: 'TableField' }]
            : [{ label: t('Selector mode'), value: 'CollectionField' }, { label: t('Subform mode'), value: 'FormField' }]
          }
          value={fieldSchema['x-component']}
          onChange={(v) => {
            const schema: ISchema = {
              name: collectionField.name,
              title: compile(collectionField.uiSchema?.title),
              "x-decorator": "FormItem",
              "x-designer": "FormItem.Designer",
              "x-component": v,
            }

            interfaceConfig?.schemaInitialize?.(schema, { field: collectionField, block: 'Form', readPretty: field.readPretty, action: tk ? 'get' : null })

            insertAdjacent('beforeBegin', gridRowColWrap(schema), {
              onSuccess: () => {
                dn.remove(null, {
                  removeParentsIfNoChildren: true,
                  breakRemoveOn: {
                    'x-component': 'Grid',
                  },
                });
              }
            });
          }}
        />
      )}
      {collectionField?.target && fieldSchema['x-component'] === 'CollectionField' && (
        <SchemaSettings.SelectItem
          title={t('Title field')}
          options={options}
          value={field?.componentProps?.fieldNames?.label}
          onChange={(label) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            const fieldNames = {
              ...field.componentProps.fieldNames,
              label,
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            field.componentProps.fieldNames = fieldNames;
            schema['x-component-props'] = {
              fieldNames,
            };
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          }}
        />
      )}
      {collectionField && <SchemaSettings.Divider />}
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete field')
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
