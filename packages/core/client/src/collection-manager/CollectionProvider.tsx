import { FC, ReactNode } from 'react';
import { CollectionProviderV2 } from '../application/data-source/collection/CollectionProvider';
import { CollectionManagerProviderV2 } from '../application/data-source/collection/CollectionManagerProvider';
import { CollectionOptionsV2 } from '../application/data-source/collection/Collection';
import React from 'react';

export const CollectionProvider: FC<{
  name?: string;
  collection?: CollectionOptionsV2 | string;
  allowNull?: boolean;
  children?: ReactNode;
  dataSource?: string;
}> = ({ children, allowNull, name, dataSource, collection }) => {
  if (dataSource) {
    return (
      <CollectionManagerProviderV2 dataSource={dataSource}>
        <CollectionProviderV2 allowNull={allowNull} name={name || collection}>
          {children}
        </CollectionProviderV2>
      </CollectionManagerProviderV2>
    );
  }

  return (
    <CollectionProviderV2 allowNull={allowNull} name={name || collection}>
      {children}
    </CollectionProviderV2>
  );
};
