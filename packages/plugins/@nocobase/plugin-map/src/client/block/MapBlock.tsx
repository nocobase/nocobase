import { useCollectionManagerV2, useCollectionV2, useProps } from '@nocobase/client';
import React, { useMemo } from 'react';
import { MapBlockComponent } from '../components';

export const MapBlock = (props) => {
  const { fieldNames } = useProps(props);
  const cm = useCollectionManagerV2();
  const { name } = useCollectionV2();
  const collectionField = useMemo(() => {
    return cm.getCollectionField([name, fieldNames?.field].flat().join('.'));
  }, [name, fieldNames?.field]);

  const fieldComponentProps = collectionField?.uiSchema?.['x-component-props'];
  return <MapBlockComponent {...fieldComponentProps} {...props} collectionField={collectionField} />;
};
