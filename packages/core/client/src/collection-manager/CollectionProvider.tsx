import { FC, ReactNode } from 'react';
import { CollectionManagerProviderV2, CollectionOptionsV2, CollectionProviderV2 } from '../application';

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
