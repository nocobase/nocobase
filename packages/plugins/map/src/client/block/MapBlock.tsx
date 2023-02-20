import { useCollection, useProps } from '@nocobase/client';
import React, { useMemo } from 'react';
import Map from '../components/Map';

export const MapBlock = (props) => {
  const { fieldNames, dataSource, fixedBlock, zoom } = useProps(props);
  const { getField } = useCollection();
  const field = getField(fieldNames?.field);
  const value = useMemo(() => {
    return dataSource
      ?.map((item) => {
        return item[fieldNames?.field];
      })
      .filter(Boolean);
  }, [dataSource]);

  return (
    <Map
      {...field?.uiSchema?.['x-component-props']}
      style={{ height: fixedBlock ? '100%' : null }}
      type={field?.type}
      dataSource={value}
      zoom={zoom}
      disabled
    ></Map>
  );
};
