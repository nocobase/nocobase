import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { BlockRequestProviderV2 } from './DataBlockRequestProvider';
import { Designable, useDesignable } from '../../schema-component';
import { withDynamicSchemaProps } from '../hoc';
import { DataBlockResourceProviderV2 } from './DataBlockResourceProvider';
import { AssociationProviderV2, CollectionProviderV2, RecordV2 } from '../collection';
import { UseRequestOptions, UseRequestService } from '../../api-client';
import { CollectionDataSourceProvider } from './CollectionDataSourceProvider';

export interface AllDataBlockProps {
  collection: string;
  association: string;
  dataSource?: string;
  sourceId?: string | number;
  filterByTk: string | number;
  record: RecordV2;
  action?: 'list' | 'get';
  params?: Record<string, any>;
  parentRecord?: RecordV2;
  requestService?: UseRequestService<any>;
  requestOptions?: UseRequestOptions;
  [index: string]: any;
}

type CollectionCreate = Pick<AllDataBlockProps, 'collection' | 'dataSource'>;

interface CollectionGet
  extends Pick<
    AllDataBlockProps,
    'collection' | 'dataSource' | 'filterByTk' | 'params' | 'requestService' | 'requestOptions'
  > {
  action: 'get';
}

interface CollectionList
  extends Pick<AllDataBlockProps, 'collection' | 'dataSource' | 'params' | 'requestService' | 'requestOptions'> {
  action: 'list';
}

type CollectionRecord = Pick<
  AllDataBlockProps,
  'collection' | 'dataSource' | 'record' | 'requestService' | 'requestOptions'
>;

type AssociationCreate = Pick<AllDataBlockProps, 'association' | 'dataSource' | 'sourceId' | 'parentRecord'>;

interface AssociationGet
  extends Pick<
    AllDataBlockProps,
    | 'association'
    | 'dataSource'
    | 'sourceId'
    | 'parentRecord'
    | 'filterByTk'
    | 'params'
    | 'requestService'
    | 'requestOptions'
  > {
  action: 'get';
}

interface AssociationList
  extends Pick<
    AllDataBlockProps,
    'association' | 'dataSource' | 'sourceId' | 'parentRecord' | 'params' | 'requestService' | 'requestOptions'
  > {
  action: 'list';
}

type AssociationRecord = Pick<
  AllDataBlockProps,
  'association' | 'dataSource' | 'record' | 'parentRecord' | 'requestService' | 'requestOptions'
>;

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
) => Omit<AllDataBlockType[T], 'association' | 'collection' | 'dataSource' | 'action'> & { [index: string]: any };

export interface DataBlockContextValue<T extends {} = {}> {
  props: AllDataBlockProps & T;
  dn: Designable;
}

export const DataBlockContextV2 = createContext<DataBlockContextValue<any>>({} as any);
DataBlockContextV2.displayName = 'DataBlockContextV2';

export const DataBlockProviderV2: FC<DataBlockProviderProps & { children?: ReactNode }> = withDynamicSchemaProps(
  (props) => {
    const { collection, association, dataSource, children, ...resets } = props as Partial<AllDataBlockProps>;
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
      <DataBlockContextV2.Provider
        value={{
          dn,
          props: { ...resets, collection, association, dataSource } as AllDataBlockProps,
        }}
      >
        <CollectionDataSourceProvider dataSource={dataSource}>
          <AssociationOrCollection.Component name={AssociationOrCollection.name}>
            <DataBlockResourceProviderV2>
              <BlockRequestProviderV2>{children}</BlockRequestProviderV2>
            </DataBlockResourceProviderV2>
          </AssociationOrCollection.Component>
        </CollectionDataSourceProvider>
      </DataBlockContextV2.Provider>
    );
  },
  { displayName: 'DataBlockProviderV2' },
);

export const useDataBlockV2 = <T extends {}>() => {
  const context = useContext<DataBlockContextValue<T>>(DataBlockContextV2);
  if (!context) {
    throw new Error('useDataBlockV2() must be used within a DataBlockProviderV2');
  }

  return context;
};

export const useDataBlockPropsV2 = <T extends {}>(): DataBlockContextValue<T>['props'] => {
  const context = useDataBlockV2<T>();
  return context.props;
};
