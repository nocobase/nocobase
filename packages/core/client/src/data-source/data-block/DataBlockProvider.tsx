/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React, { FC, ReactNode, createContext, useContext, useMemo } from 'react';

import { ACLCollectionProvider } from '../../acl/ACLProvider';
import { UseRequestOptions, UseRequestService } from '../../api-client';
import { withDynamicSchemaProps } from '../../hoc/withDynamicSchemaProps';
import { Designable, useDesignable } from '../../schema-component';
import {
  AssociationProvider,
  CollectionManagerProvider,
  CollectionOptions,
  SanitizedCollectionProvider,
} from '../collection';
import { CollectionRecord } from '../collection-record';
import { BlockRequestProvider } from './DataBlockRequestProvider';
import { DataBlockResourceProvider } from './DataBlockResourceProvider';

export interface AllDataBlockProps {
  collection: string | CollectionOptions;
  association: string;
  dataSource?: string;
  sourceId?: string | number;
  filterByTk: string | number;
  record: CollectionRecord;
  action?: 'list' | 'get';
  params?: {
    filterByTk?: string | number;
    [index: string]: any;
  };
  parentRecord?: CollectionRecord;
  requestService?: UseRequestService<any>;
  requestOptions?: UseRequestOptions;
  dataLoadingMode?: 'auto' | 'manual';
  /** 如果为 true，则区块会被隐藏 */
  hidden?: boolean;
  [index: string]: any;
}

type CollectionCreateProps = Pick<AllDataBlockProps, 'collection' | 'dataSource'>;

interface CollectionGetProps
  extends Pick<
    AllDataBlockProps,
    'collection' | 'dataSource' | 'filterByTk' | 'params' | 'requestService' | 'requestOptions'
  > {
  action: 'get';
}

interface CollectionListProps
  extends Pick<AllDataBlockProps, 'collection' | 'dataSource' | 'params' | 'requestService' | 'requestOptions'> {
  action: 'list';
}

type CollectionRecordProps = Pick<
  AllDataBlockProps,
  'collection' | 'dataSource' | 'record' | 'requestService' | 'requestOptions'
>;

type AssociationCreateProps = Pick<AllDataBlockProps, 'association' | 'dataSource' | 'sourceId' | 'parentRecord'>;

interface AssociationGetProps
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

interface AssociationListProps
  extends Pick<
    AllDataBlockProps,
    'association' | 'dataSource' | 'sourceId' | 'parentRecord' | 'params' | 'requestService' | 'requestOptions'
  > {
  action: 'list';
}

type AssociationRecordProps = Pick<
  AllDataBlockProps,
  'association' | 'dataSource' | 'record' | 'parentRecord' | 'requestService' | 'requestOptions'
>;

type AllDataBlockType = {
  CollectionCreate: CollectionCreateProps;
  CollectionGet: CollectionGetProps;
  CollectionList: CollectionListProps;
  CollectionRecord: CollectionRecordProps;
  AssociationCreate: AssociationCreateProps;
  AssociationGet: AssociationGetProps;
  AssociationList: AssociationListProps;
  AssociationRecord: AssociationRecordProps;
};

export type DataBlockProviderProps = AllDataBlockType[keyof AllDataBlockType];

export type UseDataBlockProps<T extends keyof AllDataBlockType> = (
  props: DataBlockProviderProps & { [index: string]: any },
) => Omit<AllDataBlockType[T], 'association' | 'collection' | 'dataSource' | 'action'> & { [index: string]: any };

export interface DataBlockContextValue<T extends {} = {}> {
  props: AllDataBlockProps & T;
  dn: Designable;
  heightProps?: any;
}

export const DataBlockContext = createContext<DataBlockContextValue<any>>({} as any);
DataBlockContext.displayName = 'DataBlockContext';

/**
 * @internal
 */
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
      Component: SanitizedCollectionProvider,
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
    const { collection, association, dataSource, children, hidden, ...resets } = props as Partial<AllDataBlockProps>;
    const { dn } = useDesignable();
    const fieldSchema = useFieldSchema();
    const disablePageHeader = useMemo(() => getIsdisablePageHeader(fieldSchema), []);
    if (hidden) {
      return null;
    }
    return (
      <DataBlockContext.Provider
        value={{
          dn,
          props: { ...resets, collection, association, dataSource } as AllDataBlockProps,
          heightProps: { ...fieldSchema?.['x-component-props'], disablePageHeader },
        }}
      >
        <CollectionManagerProvider dataSource={dataSource}>
          <AssociationOrCollectionProvider collection={collection} association={association}>
            <ACLCollectionProvider>
              <DataBlockResourceProvider>
                <BlockRequestProvider>{children}</BlockRequestProvider>
              </DataBlockResourceProvider>
            </ACLCollectionProvider>
          </AssociationOrCollectionProvider>
        </CollectionManagerProvider>
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

const getIsdisablePageHeader = (schema) => {
  if (!schema) return null;

  if (schema['x-component'] === 'Page') {
    return schema?.['x-component-props']?.disablePageHeader;
  }
  return getIsdisablePageHeader(schema.parent);
};
