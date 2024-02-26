import { useFieldSchema, useForm } from '@formily/react';
import { EllipsisWithTooltip, useCollection_deprecated, useFieldTitle } from '@nocobase/client';
import React from 'react';
import { MapComponent } from './MapComponent';

const ReadPretty = (props) => {
  const { value } = props;
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection_deprecated();
  const collectionField = getField(fieldSchema.name);
  const mapType = props.mapType || collectionField?.uiSchema['x-component-props']?.mapType;
  const form = useForm();
  useFieldTitle();

  if (!form.readPretty) {
    return (
      <div>
        <EllipsisWithTooltip ellipsis={true}>
          {value?.map?.((item) => (Array.isArray(item) ? `(${item.join(',')})` : item)).join(',')}
        </EllipsisWithTooltip>
      </div>
    );
  }

  return <MapComponent readonly mapType={mapType} {...props}></MapComponent>;
};

export default ReadPretty;
