import React, { FC, ReactNode } from 'react';

import { CollectionProviderV2 } from './CollectionProvider';
import { CollectionFieldProviderV2 } from './CollectionFieldProvider';
import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { Spin } from 'antd';
import { useRequest } from '../../api-client';

export interface AssociationProviderProps {
  ns?: string;
  name: string;
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderProps> = (props) => {
  const { name, ns, children } = props;

  const collectionManager = useCollectionManagerV2();
  const { loading, data: collectionName } = useRequest<string>(
    () => collectionManager.getCollectionName(name, { ns }),
    {
      refreshDeps: [name, ns],
    },
  );

  if (loading) return <Spin />;

  return (
    <CollectionProviderV2 name={name.split('.')[0]} ns={ns}>
      <CollectionFieldProviderV2 name={name}>
        <CollectionProviderV2 name={collectionName} ns={ns}>
          {children}
        </CollectionProviderV2>
      </CollectionFieldProviderV2>
    </CollectionProviderV2>
  );
};
