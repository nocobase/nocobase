import React, { FC, ReactNode, useMemo } from 'react';

import { CollectionFieldOptions } from '../../collection-manager';
import { CollectionProviderV2 } from './CollectionProvider';
import { CollectionFieldProviderV2, useCollectionFieldDataV2 } from './CollectionFieldProvider';
import type { CollectionFieldV2 } from './CollectionField';

const AssociationTargetCollection: FC<{ children?: ReactNode }> = ({ children }) => {
  const associationFieldData = useCollectionFieldDataV2();
  const collectionName = useMemo(() => {
    return associationFieldData.target;
  }, [associationFieldData]);

  if (!collectionName) return null;

  return <CollectionProviderV2 name={collectionName}>{children}</CollectionProviderV2>;
};

export type AssociationProviderProps = (
  | { name: string }
  | { associationField: CollectionFieldV2 | CollectionFieldOptions }
) & {
  children?: ReactNode;
};
export const AssociationProviderV2: FC<AssociationProviderProps> = (props) => {
  const { name, associationField, children } = props as {
    name: string;
    associationField: CollectionFieldV2 | CollectionFieldOptions;
    children?: ReactNode;
  };

  return (
    <CollectionFieldProviderV2 name={name} collectionField={associationField}>
      <AssociationTargetCollection>{children}</AssociationTargetCollection>
    </CollectionFieldProviderV2>
  );
};
