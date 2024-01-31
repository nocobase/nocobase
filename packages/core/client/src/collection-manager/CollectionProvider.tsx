import { FC, ReactNode, useMemo } from 'react';
import { CollectionContextV2, CollectionOptionsV2, CollectionProviderV2 } from '../application';
import { useCollectionManagerV2 } from '../application/collection/CollectionManagerProvider';

import React from 'react';
import { useCollectionDataSourceName } from '../application/collection/CollectionDataSourceProvider';

export const CollectionProvider: FC<{
  name?: string;
  collection?: CollectionOptionsV2 | string;
  allowNull?: boolean;
  children?: ReactNode;
  dataSource?: string;
}> = ({ children, allowNull, name, dataSource, collection }) => {
  const dataSourceName = useCollectionDataSourceName();
  const dataSourceValue = dataSource || dataSourceName || undefined;
  const cm = useCollectionManagerV2();
  const collectionInstance = useMemo(
    () => cm.getCollection(name || collection, { dataSource: dataSourceValue }),
    [name, collection, dataSourceValue],
  );

  if (typeof collection === 'object') {
    return <CollectionContextV2.Provider value={collectionInstance}>{children}</CollectionContextV2.Provider>;
  }
  return (
    <CollectionProviderV2 allowNull={allowNull} name={name || collection} dataSource={dataSourceValue}>
      {children}
    </CollectionProviderV2>
  );
};
