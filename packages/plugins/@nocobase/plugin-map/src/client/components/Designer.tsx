import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  GeneralSchemaItems,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  isPatternDisabled,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useDesignable,
  useFormBlockContext,
} from '@nocobase/client';
import lodash from 'lodash';
import React from 'react';
import { useMapTranslation } from '../locale';

const Designer = () => {
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { getField } = useCollection_deprecated();
  const { form } = useFormBlockContext();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useMapTranslation();
  const { dn, refresh } = useDesignable();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
  const originalTitle = collectionField?.uiSchema?.title;
  const initialValue = {
    title: field.title === originalTitle ? undefined : field.title,
  };
  if (!field.readPretty) {
    initialValue['required'] = field.required;
  }

  let readOnlyMode = 'editable';
  if (fieldSchema['x-disabled'] === true) {
    readOnlyMode = 'readonly';
  }
  if (fieldSchema['x-read-pretty'] === true) {
    readOnlyMode = 'read-pretty';
  }

  return (
    <GeneralSchemaDesigner>
      <GeneralSchemaItems />
      {form && !form?.readPretty && !isPatternDisabled(fieldSchema) && (
        <SchemaSettingsSelectItem
          key="pattern"
          title={t('Pattern')}
          options={[
            { label: t('Editable'), value: 'editable' },
            { label: t('Readonly'), value: 'readonly' },
            { label: t('Easy-reading'), value: 'read-pretty' },
          ]}
          value={readOnlyMode}
          onChange={(v) => {
            const schema: ISchema = {
              ['x-uid']: fieldSchema['x-uid'],
            };

            switch (v) {
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
              schema,
            });

            dn.refresh();
          }}
        />
      )}
      <SchemaSettingsModalItem
        key="map-zoom"
        title={t('Set default zoom level')}
        schema={
          {
            type: 'object',
            title: t('Set default zoom level'),
            properties: {
              zoom: {
                title: t('Zoom'),
                default: field.componentProps.zoom || 13,
                description: t('The default zoom level of the map'),
                'x-decorator': 'FormItem',
                'x-component': 'InputNumber',
                'x-component-props': {
                  precision: 0,
                },
              },
            },
          } as ISchema
        }
        onSubmit={({ zoom }) => {
          if (zoom) {
            lodash.set(fieldSchema, 'x-component-props.zoom', zoom);
            Object.assign(field.componentProps, fieldSchema['x-component-props']);

            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': field.componentProps,
              },
            });
          }
          dn.refresh();
        }}
      />
      <SchemaSettingsRemove
        key="remove"
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete field'),
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export default Designer;
