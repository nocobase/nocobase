import { FC, ReactNode } from 'react';
import { CollectionProvider } from '../data-source/collection/CollectionProvider';
import { CollectionManagerProvider } from '../data-source/collection/CollectionManagerProvider';
import { CollectionOptions } from '../data-source/collection/Collection';
import React from 'react';

/**
 * @deprecated use `CollectionProvider` instead
 */
export const CollectionProvider_deprecated: FC<{
  name?: string;
  collection?: CollectionOptions | string;
  allowNull?: boolean;
  children?: ReactNode;
  dataSource?: string;
}> = ({ children, allowNull, name, dataSource, collection }) => {
  if (dataSource) {
    return (
      <CollectionManagerProvider dataSource={dataSource}>
        <CollectionProvider allowNull={allowNull} name={name || collection}>
          {children}
        </CollectionProvider>
      </CollectionManagerProvider>
    );
  }

  return (
    <CollectionProvider allowNull={allowNull} name={name || collection}>
      {children}
    </CollectionProvider>
  );
};
