import { useField, useFieldSchema } from '@formily/react';
import { useCollection } from '@nocobase/client';
import React, { useEffect } from 'react';
import AMapComponent from './AMap';

const ReadPretty = (props) => {
  const { value, readOnly } = props;
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const mapType = props.mapType || collectionField?.uiSchema['x-component-props']?.mapType;
  const field = useField();

  useEffect(() => {
    if (!field.title) {
      field.title = collectionField.uiSchema.title;
    }
  }, collectionField.title);

  if (!readOnly)
    return (
      <div
        style={{
          whiteSpace: 'pre-wrap',
        }}
      >
        {value?.map((item) => (Array.isArray(item) ? `(${item.join(',')})` : item)).join(',')}
      </div>
    );

  return mapType === 'amap' ? <AMapComponent mapType={mapType} {...props}></AMapComponent> : null;
};

export default ReadPretty;
