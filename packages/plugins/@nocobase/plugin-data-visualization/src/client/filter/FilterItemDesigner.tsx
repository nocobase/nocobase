import React from 'react';
import {
  EditDescription,
  EditOperator,
  EditTooltip,
  GeneralSchemaDesigner,
  SchemaSettings,
  useCollection,
  useCollectionManager,
  useDesignable,
} from '@nocobase/client';
import { useChartsTranslation } from '../locale';
import { useField, useFieldSchema } from '@formily/react';
import { Field } from '@formily/core';

const EditTitle = () => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useChartsTranslation();
  const { dn } = useDesignable();

  return (
    <SchemaSettings.ModalItem
      key="edit-field-title"
      title={t('Edit field title')}
      schema={{
        type: 'object',
        title: t('Edit field title'),
        properties: {
          title: {
            title: t('Field title'),
            default: field?.title,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-component-props': {},
          },
        },
      }}
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
  );
};

export const ChartFilterItemDesigner = () => {
  const { getCollectionJoinField } = useCollectionManager();
  const { getField } = useCollection();
  const { t } = useChartsTranslation();
  const fieldSchema = useFieldSchema();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

  return (
    <GeneralSchemaDesigner disableInitializer>
      <EditTitle />
      <EditDescription />
      <EditTooltip />
      <EditOperator />
      {collectionField ? <SchemaSettings.Divider /> : null}
      <SchemaSettings.Remove
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
