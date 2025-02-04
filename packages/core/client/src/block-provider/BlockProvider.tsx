/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field, GeneralField } from '@formily/core';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { useUpdate } from 'ahooks';
import { Col, Row } from 'antd';
import { isArray } from 'lodash';
import template from 'lodash/template';
import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DataBlockProvider,
  TableFieldResource,
  WithoutTableFieldResource,
  useCollectionManager,
  useCollectionParentRecord,
  useCollectionRecord,
  useCollectionRecordData,
  useDataBlockProps,
  useDataBlockRequest,
  useDataBlockResource,
  useDesignable,
  useRecord,
} from '../';
import { ACLCollectionProvider } from '../acl/ACLProvider';
import {
  CollectionProvider_deprecated,
  useCollectionManager_deprecated,
  useCollection_deprecated,
} from '../collection-manager';
import { RefreshComponentProvider, useRefreshComponent } from '../formily/NocoBaseRecursionField';
import { useSourceId } from '../modules/blocks/useSourceId';
import { RecordProvider, useRecordIndex } from '../record-provider';
import { useAssociationNames } from './hooks';
import { useDataBlockParentRecord } from './hooks/useDataBlockParentRecord';

/**
 * @deprecated
 */
export const BlockResourceContext = createContext(null);
BlockResourceContext.displayName = 'BlockResourceContext';
export const BlockAssociationContext = createContext(null);
BlockAssociationContext.displayName = 'BlockAssociationContext';

/**
 * @deprecated
 */
export const BlockRequestContext_deprecated = createContext<{
  block?: string;
  props?: any;
  field?: GeneralField;
  service?: any;
  resource?: any;
  __parent?: any;
  updateAssociationValues?: any[];
}>({});
BlockRequestContext_deprecated.displayName = 'BlockRequestContext_deprecated';

/**
 * @deprecated
 * use `useDataBlockResource` instead
 * @returns
 */
export const useBlockResource = () => {
  const resource = useDataBlockResource();
  return useContext(BlockResourceContext) || resource;
};

/**
 * @internal
 * @param props
 * @returns
 */
export const MaybeCollectionProvider = (props) => {
  const { collection } = props;
  return collection ? (
    <CollectionProvider_deprecated collection={collection}>
      <ACLCollectionProvider>{props.children}</ACLCollectionProvider>
    </CollectionProvider_deprecated>
  ) : (
    props.children
  );
};

/**
 * @deprecated
 * use `DataBlockRequestProvider` instead
 * @param props
 * @returns
 */
export const BlockRequestProvider_deprecated = (props) => {
  const field = useField<Field>();
  const resource = useDataBlockResource();
  const service = useDataBlockRequest();
  const record = useCollectionRecord();
  const parentRecord = useCollectionParentRecord();

  const __parent = useBlockRequestContext();
  const value = useMemo(() => {
    return {
      block: props.block,
      props,
      field,
      service,
      resource,
      __parent,
      updateAssociationValues: props?.updateAssociationValues || [],
    };
  }, [__parent, field, props, resource, service]);

  return (
    <BlockRequestContext_deprecated.Provider value={value}>
      {/* 用于兼容旧版 record.__parent 的写法 */}
      <RecordProvider isNew={record?.isNew} record={record?.data} parent={parentRecord?.data}>
        {props.children}
      </RecordProvider>
    </BlockRequestContext_deprecated.Provider>
  );
};

/**
 * @deprecated
 * use `useDataBlockRequest` instead
 */
export const useBlockRequestContext = () => {
  return useContext(BlockRequestContext_deprecated);
};

/**
 * @deprecated
 * 废弃组件，不建议使用
 */
export const RenderChildrenWithAssociationFilter: React.FC<any> = (props) => {
  const fieldSchema = useFieldSchema();
  const { findComponent } = useDesignable();
  const field = useField();
  const Component = findComponent(field.component?.[0]) || React.Fragment;
  const associationFilterSchema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'AssociationFilter') {
      return s;
    }
    return buf;
  }, null);

  if (associationFilterSchema) {
    return (
      <Component {...field.componentProps}>
        <Row style={{ height: '100%' }} gutter={16} wrap={false}>
          <Col
            style={{
              width: 200,
              flex: '0 0 auto',
              ...(props.associationFilterStyle || {}),
            }}
          >
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => s['x-component'] === 'AssociationFilter'}
            />
          </Col>
          <Col
            style={{
              flex: '1 1 auto',
              minWidth: 0,
            }}
          >
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <RecursionField
                schema={fieldSchema}
                onlyRenderProperties
                filterProperties={(s) => s['x-component'] !== 'AssociationFilter'}
              />
            </div>
          </Col>
        </Row>
      </Component>
    );
  }
  return props.children;
};

/**
 * @internal
 */
export const BlockContext = createContext<{
  /** 用以区分区块的标识 */
  name: string;
}>(null);
BlockContext.displayName = 'BlockContext';

/**
 * @internal
 * @returns
 */
export const useBlockContext = () => {
  return useContext(BlockContext);
};

/**
 * 用于兼容旧版本 Schema
 */
const useCompatDataBlockParentRecord = (props) => {
  const fieldSchema = useFieldSchema();

  // 如果存在 x-use-decorator-props，说明是新版 Schema
  if (fieldSchema['x-use-decorator-props']) {
    return props.parentRecord;
  } else {
    // 是否存在 x-use-decorator-props 是固定不变的，所以这里可以使用 hooks
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDataBlockParentRecord(props);
  }
};

/**
 * @deprecated
 * use `DataBlockProvider` instead
 */
export const BlockProvider = (props: {
  name: string;
  resource: any;
  collection?: any;
  association?: any;
  dataSource?: string;
  params?: any;
  children?: any;
  parentRecord?: any;
  /** @deprecated */
  useSourceId?: any;
  /** @deprecated */
  useParams?: any;
}) => {
  const { name, dataSource, useParams, parentRecord } = props;
  const parentRecordFromHook = useCompatDataBlockParentRecord(props);
  const refreshComponent = useRefreshComponent();
  const _refresh = useUpdate();

  const refresh = useCallback(() => {
    _refresh();
    refreshComponent?.();
  }, [_refresh, refreshComponent]);

  // 新版（1.0）已弃用 useParams，这里之所以继续保留是为了兼容旧版的 UISchema
  const paramsFromHook = useParams?.();

  const { getAssociationAppends } = useAssociationNames(dataSource);
  const { appends, updateAssociationValues } = getAssociationAppends();
  const params = useMemo(() => {
    if (!props.params?.['appends']) {
      return { ...props.params, appends, ...paramsFromHook };
    }
    return { ...props.params, ...paramsFromHook };
  }, [appends, paramsFromHook, props.params]);
  const blockValue = useMemo(() => ({ name }), [name]);

  return (
    <BlockContext.Provider value={blockValue}>
      <DataBlockProvider {...(props as any)} params={params} parentRecord={parentRecord || parentRecordFromHook}>
        <BlockRequestProvider_deprecated {...props} updateAssociationValues={updateAssociationValues} params={params}>
          <RefreshComponentProvider refresh={refresh}>{props.children}</RefreshComponentProvider>
        </BlockRequestProvider_deprecated>
      </DataBlockProvider>
    </BlockContext.Provider>
  );
};

/**
 * @deprecated
 * use `useDataBlockProps` instead
 * @returns
 */
export const useBlockAssociationContext = () => {
  const { association } = useDataBlockProps();
  return useContext(BlockAssociationContext) || association;
};

export const useFilterByTk = (blockProps?: any) => {
  const { resource, __parent } = useBlockRequestContext();
  const recordIndex = useRecordIndex();
  const recordData = useCollectionRecordData();
  const collection = useCollection_deprecated();
  const association = useBlockAssociationContext();
  const assoc = blockProps?.association || association;
  const withoutTableFieldResource = useContext(WithoutTableFieldResource);
  const cm = useCollectionManager();

  if (!withoutTableFieldResource) {
    if (resource instanceof TableFieldResource || __parent?.block === 'TableField') {
      return recordIndex;
    }
  }

  if (assoc) {
    const association = cm.getCollectionField(assoc);
    return recordData?.[association.targetKey || association.sourceKey || 'id'];
  }
  if (isArray(collection.filterTargetKey)) {
    const filterByTk = {};
    for (const key of collection.filterTargetKey) {
      filterByTk[key] = recordData?.[key];
    }
    return filterByTk;
  } else {
    return recordData?.[collection.filterTargetKey || 'id'];
  }
};

/**
 * @deprecated
 */
export const useSourceIdFromRecord = () => {
  const record = useRecord();
  const { getCollectionField } = useCollectionManager_deprecated();
  const association = useBlockAssociationContext();
  if (association) {
    const collectionField = getCollectionField(association);
    return record?.[collectionField.sourceKey || 'id'];
  }
};

/**
 * @deprecated
 * use `useSourceId` instead
 */
export const useSourceIdFromParentRecord = () => {
  return useSourceId();
};

/**
 * @internal
 * @returns
 */
export const useParamsFromRecord = (props?: any) => {
  const filterByTk = useFilterByTk(props);
  const record = useRecord();
  const { fields } = useCollection_deprecated();
  const fieldSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getCollectionJoinField(
    fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association,
  );
  const filterFields = fields
    .filter((v) => {
      return ['boolean', 'date', 'integer', 'radio', 'sort', 'string', 'time', 'uid', 'uuid'].includes(v.type);
    })
    .map((v) => v.name);
  const filter = Object.keys(record)
    .filter((key) => filterFields.includes(key))
    .reduce((result, key) => {
      result[key] = record[key];
      return result;
    }, {});

  const obj = {
    filterByTk: filterByTk,
  };
  if (record.__collection && collectionField && !['oho', 'm2o', 'obo'].includes(collectionField.interface)) {
    obj['targetCollection'] = record.__collection;
  }
  if (!filterByTk && Object.keys(filter).length > 0) {
    obj['filter'] = filter;
  }
  return obj;
};

export const RecordLink = (props) => {
  const field = useField();
  const record = useRecord();
  const { title, to, ...others } = props;
  const compiled = template(to || '');
  return (
    <Link {...others} to={compiled({ record: record || {} })}>
      {field.title}
    </Link>
  );
};
