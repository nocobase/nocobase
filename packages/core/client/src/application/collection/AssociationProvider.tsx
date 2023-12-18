import React, { FC, ReactNode, useMemo } from 'react';

import { CollectionFieldOptions } from '../../collection-manager';
import { CollectionProviderV2 } from './CollectionProvider';
import { CollectionFieldProviderV2 } from './CollectionFieldProvider';
import { CollectionFieldV2 } from './CollectionField';

export type AssociationProviderProps = (
  | { name: string }
  | { associationField: CollectionFieldV2 | CollectionFieldOptions }
) & {
  ns?: string;
  children?: ReactNode;
};
export const AssociationProviderV2: FC<AssociationProviderProps> = (props) => {
  const { name, ns, associationField, children } = props as {
    name: string;
    ns?: string;
    associationField: CollectionFieldV2 | CollectionFieldOptions;
    children?: ReactNode;
  };

  const collectionName = useMemo(() => {
    if (name) return name;
    if (associationField instanceof CollectionFieldV2) {
      return associationField.data.name;
    }
    return associationField?.target;
  }, [associationField, name]);

  return (
    <CollectionFieldProviderV2 name={name} collectionField={associationField} ns={ns}>
      <CollectionProviderV2 name={collectionName} ns={ns}>
        {children}
      </CollectionProviderV2>
    </CollectionFieldProviderV2>
  );
};
