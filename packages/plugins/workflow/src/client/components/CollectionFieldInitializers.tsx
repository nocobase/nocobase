import React from 'react';
import { cloneDeep } from 'lodash';
import { SchemaInitializer, useCollection, InitializerWithSwitch, gridRowColWrap } from '@nocobase/client';



function CollectionFieldInitializer({ field, ...props }) {
  const uiSchema = cloneDeep(field.uiSchema);
  delete uiSchema['x-uid'];

  return (
    <InitializerWithSwitch
      {...props}
      schema={{
        ...uiSchema,
        title: uiSchema.title ?? field.name,
        'x-decorator': 'FormItem',
        'x-read-pretty': true,
        'x-designer': 'FormItem.Designer',
        'x-collection-field': field.name,
      }}
      type="x-collection-field"
    />
  );
}

export function CollectionFieldInitializers(props) {
  const { fields } = useCollection();
  const items = fields.map(field => ({
    key: field.name,
    type: 'item',
    title: field.uiSchema?.title,
    component: CollectionFieldInitializer,
    field
  }));

  return (
    <SchemaInitializer.Button
      {...props}
      items={items}
      title="{{t('Configure fields')}}"
      wrap={gridRowColWrap}
    />
  )
}
