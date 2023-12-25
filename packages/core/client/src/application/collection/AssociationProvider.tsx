import React, { FC, ReactNode, useEffect, useState } from 'react';

import { CollectionProviderV2 } from './CollectionProvider';
import { CollectionFieldProviderV2 } from './CollectionFieldProvider';
import { useCollectionManagerV2 } from './CollectionManagerProvider';
import { Spin } from 'antd';
import { CollectionV2 } from './Collection';

export interface AssociationProviderProps {
  ns?: string;
  name: string;
  children?: ReactNode;
}

export const AssociationProviderV2: FC<AssociationProviderProps> = (props) => {
  const { name, ns, children } = props;

  const collectionManager = useCollectionManagerV2();
  const [loading, setLoading] = useState(false);
  const [collectionName, setCollectionName] = useState<string>();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await collectionManager.getCollectionName(name, { ns });
        setCollectionName(res);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    load();
  }, [collectionManager, name, ns]);

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
