import {
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useProps,
  withDynamicSchemaProps,
} from '@nocobase/client';
import React, { useMemo } from 'react';
import { MapBlockComponent } from '../components';

export const MapBlock = withDynamicSchemaProps((props) => {
  // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
  const { fieldNames } = useProps(props);

  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const { name } = useCollection_deprecated();
  const collectionField = useMemo(() => {
    return getCollectionJoinField([name, fieldNames?.field].flat().join('.'));
  }, [name, fieldNames?.field]);

  const fieldComponentProps = collectionField?.uiSchema?.['x-component-props'];
  return <MapBlockComponent {...fieldComponentProps} {...props} collectionField={collectionField} />;
});
