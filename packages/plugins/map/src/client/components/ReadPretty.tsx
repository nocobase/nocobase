import { useField, useFieldSchema, useForm } from '@formily/react';
import { EllipsisWithTooltip, useCollection } from '@nocobase/client';
import React, { useEffect } from 'react';
import AMapComponent from './AMap';

const ReadPretty = (props) => {
  const { value } = props;
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const mapType = props.mapType || collectionField?.uiSchema['x-component-props']?.mapType;
  const field = useField();
  const form = useForm();
  useEffect(() => {
    if (!field.title && collectionField?.uiSchema?.title) {
      field.title = collectionField?.uiSchema.title;
    }
  }, collectionField?.title);

  if (!form.readPretty) {
    return (
      <div>
        <EllipsisWithTooltip ellipsis={true}>
          {value?.map((item) => (Array.isArray(item) ? `(${item.join(',')})` : item)).join(',')}
        </EllipsisWithTooltip>
      </div>
    );
  }

  return mapType === 'amap' ? <AMapComponent readonly mapType={mapType} {...props}></AMapComponent> : null;
};

export default ReadPretty;
