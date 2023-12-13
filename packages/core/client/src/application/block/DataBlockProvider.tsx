import React, { FC, ReactNode, useCallback, useMemo } from 'react';
import { BlockSettingsProviderV2, BlockSettingsContextProps } from './BlockSettingsProvider';
import { CollectionProviderV2 } from './CollectionProvider';
import { AssociationProviderV2 } from './AssociationProvider';
import { BlockRequestProviderV2 } from './BlockRequestProvider';
import { useDesignable } from '../../schema-component';
import { withSchemaDecoratorProps } from '../hoc';
import { BlockResourceProviderV2 } from './BlockResourceProvider';

type CollectionCreate = Pick<BlockSettingsContextProps, 'collection'>;

interface CollectionGet extends Pick<BlockSettingsContextProps, 'collection' | 'filterByTk' | 'params'> {
  action: 'get';
}

interface CollectionList extends Pick<BlockSettingsContextProps, 'collection' | 'params'> {
  action: 'list';
}

type CollectionRecord = Pick<BlockSettingsContextProps, 'collection' | 'record'>;

type AssociationCreate = Pick<BlockSettingsContextProps, 'association' | 'sourceId' | 'parentRecord'>;

interface AssociationGet
  extends Pick<BlockSettingsContextProps, 'association' | 'sourceId' | 'parentRecord' | 'filterByTk' | 'params'> {
  action: 'get';
}

interface AssociationList
  extends Pick<BlockSettingsContextProps, 'association' | 'sourceId' | 'parentRecord' | 'params'> {
  action: 'list';
}

type AssociationRecord = Pick<BlockSettingsContextProps, 'association' | 'record' | 'parentRecord'>;

type AllDataBlockType = {
  CollectionCreate: CollectionCreate;
  CollectionGet: CollectionGet;
  CollectionList: CollectionList;
  CollectionRecord: CollectionRecord;
  AssociationCreate: AssociationCreate;
  AssociationGet: AssociationGet;
  AssociationList: AssociationList;
  AssociationRecord: AssociationRecord;
};

export type DataBlockProviderProps = AllDataBlockType[keyof AllDataBlockType];

export type UseDataBlockProps<T extends keyof AllDataBlockType> = (
  props: DataBlockProviderProps & { [index: string]: any },
) => Omit<AllDataBlockType[T], 'association' | 'collection' | 'action'> & { [index: string]: any };

export const DataBlockProviderV2: FC<DataBlockProviderProps & { children?: ReactNode }> = withSchemaDecoratorProps(
  (props) => {
    const { collection, association, children, ...resets } = props as Partial<BlockSettingsContextProps>;
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

    const changeSchemaProps = useCallback(
      (data) => {
        dn.deepMerge({
          'x-decorator-props': data,
        });
      },
      [dn],
    );

    return (
      <BlockSettingsProviderV2
        changeSchemaProps={changeSchemaProps}
        dn={dn}
        props={{ ...resets, collection, association } as BlockSettingsContextProps}
      >
        <AssociationOrCollection.Component name={AssociationOrCollection.name}>
          <BlockResourceProviderV2>
            <BlockRequestProviderV2>{children}</BlockRequestProviderV2>
          </BlockResourceProviderV2>
        </AssociationOrCollection.Component>
      </BlockSettingsProviderV2>
    );
  },
  { displayName: 'DataBlockProviderV2' },
);
