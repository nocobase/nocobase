import React, { FC, ReactNode, useMemo } from 'react';
import { BlockProviderV2, BlockContextProps } from './BlockProvider';
import { CollectionProviderV2 } from './CollectionProvider';
import { AssociationProviderV2 } from './AssociationProvider';
import { BlockRequestProviderV2 } from './BlockUseRequestProvider';
import { useDesignable } from '../../schema-component';
import { withSchemaDecoratorProps } from '../hoc';

interface CollectionCreateDataBlockProps extends Pick<BlockContextProps, 'collection'> {
  action: 'create';
  type: 'collection-create';
}

interface CollectionGetDataBlockProps extends Pick<BlockContextProps, 'collection' | 'filterByTk' | 'params'> {
  action: 'get';
  type: 'collection-get';
}

interface CollectionListDataBlockProps extends Pick<BlockContextProps, 'collection' | 'params'> {
  action: 'list';
  type: 'collection-list';
}

type CollectionRecordDataBlockProps = Pick<BlockContextProps, 'collection' | 'record'> & { type: 'collection-record' };

interface AssociationCreateDataBlockProps extends Pick<BlockContextProps, 'association' | 'sourceId' | 'parentRecord'> {
  action: 'create';
  type: 'association-create';
}

interface AssociationGetDataBlockProps
  extends Pick<BlockContextProps, 'association' | 'sourceId' | 'parentRecord' | 'filterByTk' | 'params'> {
  action: 'get';
  type: 'association-get';
}

interface AssociationListDataBlockProps
  extends Pick<BlockContextProps, 'association' | 'sourceId' | 'parentRecord' | 'params'> {
  action: 'list';
  type: 'association-list';
}

type AssociationRecordDataBlockProps = Pick<BlockContextProps, 'association' | 'record' | 'parentRecord'> & {
  type: 'association-record';
};

export type DataBlockProviderProps =
  | CollectionCreateDataBlockProps
  | CollectionGetDataBlockProps
  | CollectionListDataBlockProps
  | CollectionRecordDataBlockProps
  | AssociationCreateDataBlockProps
  | AssociationGetDataBlockProps
  | AssociationListDataBlockProps
  | AssociationRecordDataBlockProps;

export type DataBlockDecorator = () =>
  | Omit<CollectionCreateDataBlockProps, 'collection' | 'action'>
  | Omit<CollectionGetDataBlockProps, 'collection' | 'action'>
  | Omit<CollectionListDataBlockProps, 'collection' | 'action'>
  | Omit<CollectionRecordDataBlockProps, 'collection' | 'action'>
  | Omit<AssociationCreateDataBlockProps, 'association' | 'action'>
  | Omit<AssociationGetDataBlockProps, 'association' | 'action'>
  | Omit<AssociationListDataBlockProps, 'association' | 'action'>
  | Omit<AssociationRecordDataBlockProps, 'association' | 'action'>;

export const DataBlockProviderV2: FC<DataBlockProviderProps & { children?: ReactNode }> = withSchemaDecoratorProps(
  (props) => {
    const { collection, association } = props as Partial<BlockContextProps>;
    const AssociationOrCollection = useMemo(() => {
      if (association) {
        return {
          Component: AssociationProviderV2,
          name: association,
        };
      }
      return {
        Component: CollectionProviderV2,
        name: collection,
      };
    }, [collection, association]);

    const { dn } = useDesignable();

    return (
      <BlockProviderV2 dn={dn} props={props as BlockContextProps}>
        <AssociationOrCollection.Component name={AssociationOrCollection.name}>
          <BlockRequestProviderV2>{props.children}</BlockRequestProviderV2>
        </AssociationOrCollection.Component>
      </BlockProviderV2>
    );
  },
);
