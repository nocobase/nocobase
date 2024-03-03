import { useCollection_deprecated, useCollectionManager_deprecated, useProps } from '@nocobase/client';
import React, { useMemo } from 'react';
import { MapBlockComponent } from '../components';

export const MapBlock = (props) => {
  const { fieldNames } = useProps(props);
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { name } = useCollection_deprecated();
  const collectionField = useMemo(() => {
    return getCollectionJoinField([name, fieldNames?.field].flat().join('.'));
  }, [name, fieldNames?.field]);

  const fieldComponentProps = collectionField?.uiSchema?.['x-component-props'];
  return <MapBlockComponent {...fieldComponentProps} {...props} collectionField={collectionField} />;
};
