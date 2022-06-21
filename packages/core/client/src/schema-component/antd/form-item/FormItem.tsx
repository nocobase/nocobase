import { css } from '@emotion/css';
import { FormItem as Item } from '@formily/antd';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile, useDesignable } from '../..';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { BlockItem } from '../block-item';
import { HTMLEncode } from '../input/shared';

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

FormItem.Designer = () => {
  const { getCollectionFields } = useCollectionManager();
  const { getField } = useCollection();
  const { form } = useFormBlockContext();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn, refresh } = useDesignable();
  const compile = useCompile();
  const collectionField = getField(fieldSchema['name']);
  const originalTitle = collectionField?.uiSchema?.title;
  const targetFields = collectionField?.target ? getCollectionFields(collectionField.target) : [];
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
  let readOnlyMode = 'editable';
  if (fieldSchema['x-disabled'] === true) {
    readOnlyMode = 'readonly';
  }
  if (fieldSchema['x-read-pretty'] === true) {
    readOnlyMode = 'read-pretty';
  }
  console.log('f', fieldSchema, form);
  return (
    <GeneralSchemaDesigner>
      {collectionField && (
        <SchemaSettings.ModalItem
          key="edit-field-title"
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
          key="edit-description"
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
          key="edit-tooltip"
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
          key="required"
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
      {!form.readPretty && collectionField.interface !== 'o2m' && (
        <SchemaSettings.SelectItem
        key="pattern"
        title={t('Pattern')}
        options={
          [{ label: t('Editable'), value: 'editable' }, { label: t('Readonly'), value: 'readonly' }, { label: t('Easy-reading'), value: 'read-pretty' }]
        }
        value={readOnlyMode}
        onChange={(v) => {
          console.log('v', v);
          const schema: ISchema = {
            ['x-uid']: fieldSchema['x-uid'],
          };

          switch(v) {
            case 'readonly': {
              fieldSchema['x-read-pretty'] = false;  
              fieldSchema['x-disabled'] = true;
              schema['x-read-pretty'] = false;
              schema['x-disabled'] = true;
              field.readPretty = false;
              field.disabled = true;
              break;
            }
            case 'read-pretty': {
              fieldSchema['x-read-pretty'] = true;  
              fieldSchema['x-disabled'] = false;
              schema['x-read-pretty'] = true;
              schema['x-disabled'] = false;
              field.readPretty = true;
              // field.disabled = true;
              break;
            }
            default: {
              fieldSchema['x-read-pretty'] = false;  
              fieldSchema['x-disabled'] = false;
              schema['x-read-pretty'] = false;
              schema['x-disabled'] = false;
              field.readPretty = false;
              field.disabled = false;
              break;
            }
          }
          dn.emit('patch', {
            schema
          });

          dn.refresh();
        }}
      />
      )}
      {collectionField?.target && (
        <SchemaSettings.SelectItem
          key="title-field"
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
        key="remove"
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
