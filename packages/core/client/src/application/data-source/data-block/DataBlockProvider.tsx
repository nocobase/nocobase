import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { BlockRequestProviderV3 } from './DataBlockRequestProvider';
import { DataBlockResourceProviderV3 } from './DataBlockResourceProvider';
import {
  AssociationProviderV3,
  CollectionManagerProviderV3,
  CollectionOptionsV3,
  CollectionProviderV3,
} from '../collection';
import { RecordV3 } from '../record';
import { UseRequestOptions, UseRequestService } from '../../../api-client';
import { Designable, useDesignable } from '../../../schema-component';
import { withDynamicSchemaProps } from '../../hoc';
import { DataSourceProviderV3 } from '../data-source';

export interface AllDataBlockPropsV3 {
  collection: string | CollectionOptionsV3;
  association: string;
  dataSource?: string;
  sourceId?: string | number;
  filterByTk: string | number;
  record: RecordV3;
  action?: 'list' | 'get';
  params?: Record<string, any>;
  parentRecord?: RecordV3;
  requestService?: UseRequestService<any>;
  requestOptions?: UseRequestOptions;
  [index: string]: any;
}

type CollectionCreate = Pick<AllDataBlockPropsV3, 'collection' | 'dataSource'>;

interface CollectionGet
  extends Pick<
    AllDataBlockPropsV3,
    'collection' | 'dataSource' | 'filterByTk' | 'params' | 'requestService' | 'requestOptions'
  > {
  action: 'get';
}

interface CollectionList
  extends Pick<AllDataBlockPropsV3, 'collection' | 'dataSource' | 'params' | 'requestService' | 'requestOptions'> {
  action: 'list';
}

type CollectionRecord = Pick<
  AllDataBlockPropsV3,
  'collection' | 'dataSource' | 'record' | 'requestService' | 'requestOptions'
>;

type AssociationCreate = Pick<AllDataBlockPropsV3, 'association' | 'dataSource' | 'sourceId' | 'parentRecord'>;

interface AssociationGet
  extends Pick<
    AllDataBlockPropsV3,
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
    AllDataBlockPropsV3,
    'association' | 'dataSource' | 'sourceId' | 'parentRecord' | 'params' | 'requestService' | 'requestOptions'
  > {
  action: 'list';
}

type AssociationRecord = Pick<
  AllDataBlockPropsV3,
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

export type DataBlockProviderPropsV3 = AllDataBlockType[keyof AllDataBlockType];

export type UseDataBlockPropsV3<T extends keyof AllDataBlockType> = (
  props: DataBlockProviderPropsV3 & { [index: string]: any },
) => Omit<AllDataBlockType[T], 'association' | 'collection' | 'dataSource' | 'action'> & { [index: string]: any };

export interface DataBlockContextValueV3<T extends {} = {}> {
  props: AllDataBlockPropsV3 & T;
  dn: Designable;
}

export const DataBlockContextV3 = createContext<DataBlockContextValueV3<any>>({} as any);
DataBlockContextV3.displayName = 'DataBlockContextV3';

export const DataBlockProviderV3: FC<DataBlockProviderPropsV3 & { children?: ReactNode }> = withDynamicSchemaProps(
  (props) => {
    const { collection, association, dataSource, children, ...resets } = props as Partial<AllDataBlockPropsV3>;
    const AssociationOrCollection = useMemo(() => {
      if (association) {
        return {
          Component: AssociationProviderV3,
          name: association,
        };
      }
      return {
        Component: CollectionProviderV3,
        name: collection,
      };
    }, [collection, association]);

    const { dn } = useDesignable();

    return (
      <DataBlockContextV3.Provider
        value={{
          dn,
          props: { ...resets, collection, association, dataSource } as AllDataBlockPropsV3,
        }}
      >
        <DataSourceProviderV3 dataSource={dataSource}>
          <CollectionManagerProviderV3>
            <AssociationOrCollection.Component name={AssociationOrCollection.name as any}>
              <DataBlockResourceProviderV3>
                <BlockRequestProviderV3>{children}</BlockRequestProviderV3>
              </DataBlockResourceProviderV3>
            </AssociationOrCollection.Component>
          </CollectionManagerProviderV3>
        </DataSourceProviderV3>
      </DataBlockContextV3.Provider>
    );
  },
  { displayName: 'DataBlockProviderV3' },
);

export const useDataBlockV3 = <T extends {}>() => {
  const context = useContext<DataBlockContextValueV3<T>>(DataBlockContextV3);
  if (!context) {
    throw new Error('useDataBlockV3() must be used within a DataBlockProviderV3');
  }

  return context;
};

export const useDataBlockPropsV3 = <T extends {}>(): DataBlockContextValueV3<T>['props'] => {
  const context = useDataBlockV3<T>();
  return context.props;
};
