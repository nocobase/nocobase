import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { ACLCollectionProvider } from '../../acl/ACLProvider';
import { UseRequestOptions, UseRequestService } from '../../api-client';
import { withDynamicSchemaProps } from '../../application/hoc';
import { Designable, useDesignable } from '../../schema-component';
import { AssociationProvider, CollectionManagerProvider, CollectionOptions, CollectionProvider } from '../collection';
import { DataSourceProvider } from '../data-source/DataSourceProvider';
import { Record } from '../record';
import { BlockRequestProvider } from './DataBlockRequestProvider';
import { DataBlockResourceProvider } from './DataBlockResourceProvider';

export interface AllDataBlockProps {
  collection: string | CollectionOptions;
  association: string;
  dataSource?: string;
  sourceId?: string | number;
  filterByTk: string | number;
  record: Record;
  action?: 'list' | 'get';
  params?: {
    filterByTk?: string | number;
    [index: string]: any;
  };
  parentRecord?: Record;
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

export const DataBlockContext = createContext<DataBlockContextValue<any>>({} as any);
DataBlockContext.displayName = 'DataBlockContext';

export const AssociationOrCollectionProvider = (props: {
  collection: string | CollectionOptions;
  association: string;
  children: ReactNode;
  allowNull?: boolean;
}) => {
  const { collection, association, allowNull = false } = props;
  const AssociationOrCollection = useMemo(() => {
    if (association) {
      return {
        Component: AssociationProvider,
        name: association,
      };
    }
    return {
      Component: CollectionProvider,
      name: collection,
    };
  }, [collection, association]);

  return (
    <AssociationOrCollection.Component name={AssociationOrCollection.name as any} allowNull={allowNull}>
      {props.children}
    </AssociationOrCollection.Component>
  );
};

export const DataBlockProvider: FC<DataBlockProviderProps & { children?: ReactNode }> = withDynamicSchemaProps(
  (props) => {
    const { collection, association, dataSource, children, ...resets } = props as Partial<AllDataBlockProps>;
    const { dn } = useDesignable();

    return (
      <DataBlockContext.Provider
        value={{
          dn,
          props: { ...resets, collection, association, dataSource } as AllDataBlockProps,
        }}
      >
        <DataSourceProvider dataSource={dataSource}>
          <CollectionManagerProvider>
            <AssociationOrCollectionProvider collection={collection} association={association}>
              <ACLCollectionProvider>
                <DataBlockResourceProvider>
                  <BlockRequestProvider>{children}</BlockRequestProvider>
                </DataBlockResourceProvider>
              </ACLCollectionProvider>
            </AssociationOrCollectionProvider>
          </CollectionManagerProvider>
        </DataSourceProvider>
      </DataBlockContext.Provider>
    );
  },
  { displayName: 'DataBlockProvider' },
);

export const useDataBlock = <T extends {}>() => {
  const context = useContext<DataBlockContextValue<T>>(DataBlockContext);
  if (!context) {
    throw new Error('useDataBlock() must be used within a DataBlockProvider');
  }

  return context;
};

export const useDataBlockProps = <T extends {}>(): DataBlockContextValue<T>['props'] => {
  const context = useDataBlock<T>();
  return context.props;
};
