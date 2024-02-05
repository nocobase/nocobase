import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { BlockRequestProviderV2 } from './DataBlockRequestProvider';
import { DataBlockResourceProviderV2 } from './DataBlockResourceProvider';
import {
  AssociationProviderV2,
  CollectionManagerProviderV2,
  CollectionOptionsV2,
  CollectionProviderV2,
} from '../collection';
import { RecordV2 } from '../record';
import { UseRequestOptions, UseRequestService } from '../../../api-client';
import { Designable, useDesignable } from '../../../schema-component';
import { withDynamicSchemaProps } from '../../hoc';
import { DataSourceProviderV2 } from '../data-source';

export interface AllDataBlockPropsV2 {
  collection: string | CollectionOptionsV2;
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

type CollectionCreate = Pick<AllDataBlockPropsV2, 'collection' | 'dataSource'>;

interface CollectionGet
  extends Pick<
    AllDataBlockPropsV2,
    'collection' | 'dataSource' | 'filterByTk' | 'params' | 'requestService' | 'requestOptions'
  > {
  action: 'get';
}

interface CollectionList
  extends Pick<AllDataBlockPropsV2, 'collection' | 'dataSource' | 'params' | 'requestService' | 'requestOptions'> {
  action: 'list';
}

type CollectionRecord = Pick<
  AllDataBlockPropsV2,
  'collection' | 'dataSource' | 'record' | 'requestService' | 'requestOptions'
>;

type AssociationCreate = Pick<AllDataBlockPropsV2, 'association' | 'dataSource' | 'sourceId' | 'parentRecord'>;

interface AssociationGet
  extends Pick<
    AllDataBlockPropsV2,
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
    AllDataBlockPropsV2,
    'association' | 'dataSource' | 'sourceId' | 'parentRecord' | 'params' | 'requestService' | 'requestOptions'
  > {
  action: 'list';
}

type AssociationRecord = Pick<
  AllDataBlockPropsV2,
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

export type DataBlockProviderPropsV2 = AllDataBlockType[keyof AllDataBlockType];

export type UseDataBlockProps<T extends keyof AllDataBlockType> = (
  props: DataBlockProviderPropsV2 & { [index: string]: any },
) => Omit<AllDataBlockType[T], 'association' | 'collection' | 'dataSource' | 'action'> & { [index: string]: any };

export interface DataBlockContextValueV2<T extends {} = {}> {
  props: AllDataBlockPropsV2 & T;
  dn: Designable;
}

export const DataBlockContextV2 = createContext<DataBlockContextValueV2<any>>({} as any);
DataBlockContextV2.displayName = 'DataBlockContextV2';

export const DataBlockProviderV2: FC<DataBlockProviderPropsV2 & { children?: ReactNode }> = withDynamicSchemaProps(
  (props) => {
    const { collection, association, dataSource, children, ...resets } = props as Partial<AllDataBlockPropsV2>;
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
          props: { ...resets, collection, association, dataSource } as AllDataBlockPropsV2,
        }}
      >
        <DataSourceProviderV2 dataSource={dataSource}>
          <CollectionManagerProviderV2>
            <AssociationOrCollection.Component name={AssociationOrCollection.name as any}>
              <DataBlockResourceProviderV2>
                <BlockRequestProviderV2>{children}</BlockRequestProviderV2>
              </DataBlockResourceProviderV2>
            </AssociationOrCollection.Component>
          </CollectionManagerProviderV2>
        </DataSourceProviderV2>
      </DataBlockContextV2.Provider>
    );
  },
  { displayName: 'DataBlockProviderV2' },
);

export const useDataBlockV2 = <T extends {}>() => {
  const context = useContext<DataBlockContextValueV2<T>>(DataBlockContextV2);
  if (!context) {
    throw new Error('useDataBlockV2() must be used within a DataBlockProviderV2');
  }

  return context;
};

export const useDataBlockPropsV2 = <T extends {}>(): DataBlockContextValueV2<T>['props'] => {
  const context = useDataBlockV2<T>();
  return context.props;
};
