import { css } from '@emotion/css';
import { Field, GeneralField } from '@formily/core';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { Col, Row } from 'antd';
import merge from 'deepmerge';
import template from 'lodash/template';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DataBlockProvider,
  TableFieldResource,
  WithoutTableFieldResource,
  useCollectionManager,
  useDataBlockProps,
  useDataBlockRequest,
  useDataBlockResource,
  useDesignable,
  useCollectionParentRecord,
  useCollectionParentRecordData,
  useCollectionRecord,
  useRecord,
} from '../';
import { ACLCollectionProvider } from '../acl/ACLProvider';
import {
  CollectionProvider_deprecated,
  useCollectionManager_deprecated,
  useCollection_deprecated,
} from '../collection-manager';
import { DataBlockCollector } from '../filter-provider/FilterProvider';
import { RecordProvider, useRecordIndex } from '../record-provider';
import { useAssociationNames } from './hooks';
import { useDataBlockSourceId } from './hooks/useDataBlockSourceId';
import { useTemplateBlockContext } from './TemplateBlockProvider';

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
  allowedActions?: any;
  __parent?: any;
  updateAssociationValues?: any[];
}>({});
BlockRequestContext_deprecated.displayName = 'BlockRequestContext_deprecated';

export const useBlockResource = () => {
  const resource = useDataBlockResource();
  return useContext(BlockResourceContext) || resource;
};

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
 * @param props
 * @returns
 */
export const BlockRequestProvider_deprecated = (props) => {
  const field = useField<Field>();
  const resource = useDataBlockResource();
  const [allowedActions, setAllowedActions] = useState({});
  const service = useDataBlockRequest();
  const record = useCollectionRecord();
  const parentRecord = useCollectionParentRecord();

  // Infinite scroll support
  const serviceAllowedActions = (service?.data as any)?.meta?.allowedActions;
  useEffect(() => {
    if (!serviceAllowedActions) return;
    setAllowedActions((last) => {
      return merge(last, serviceAllowedActions ?? {});
    });
  }, [serviceAllowedActions]);

  const __parent = useBlockRequestContext();
  return (
    <BlockRequestContext_deprecated.Provider
      value={{
        allowedActions,
        block: props.block,
        props,
        field,
        service,
        resource,
        __parent,
        updateAssociationValues: props?.updateAssociationValues || [],
      }}
    >
      {/* 用于兼容旧版 record.__parent 的写法 */}
      <RecordProvider isNew={record?.isNew} record={record?.data} parent={parentRecord?.data}>
        {props.children}
      </RecordProvider>
    </BlockRequestContext_deprecated.Provider>
  );
};

/**
 * @deprecated
 */
export const useBlockRequestContext = () => {
  return useContext(BlockRequestContext_deprecated);
};

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
        <Row
          className={css`
            height: 100%;
          `}
          gutter={16}
          wrap={false}
        >
          <Col
            className={css`
              width: 200px;
              flex: 0 0 auto;
            `}
            style={props.associationFilterStyle}
          >
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => s['x-component'] === 'AssociationFilter'}
            />
          </Col>
          <Col
            className={css`
              flex: 1 1 auto;
              min-width: 0;
            `}
          >
            <div
              className={css`
                display: flex;
                flex-direction: column;
                height: 100%;
              `}
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

const BlockContext = createContext<{
  /** 用以区分区块的标识 */
  name: string;
}>(null);
BlockContext.displayName = 'BlockContext';

export const useBlockContext = () => {
  return useContext(BlockContext);
};

/**
 * 用于兼容旧版本 Schema
 */
const useCompatDataBlockSourceId = (props) => {
  const fieldSchema = useFieldSchema();

  // 如果存在 x-use-decorator-props，说明是新版 Schema
  if (fieldSchema['x-use-decorator-props']) {
    return props.sourceId;
  } else {
    // 是否存在 x-use-decorator-props 是固定不变的，所以这里可以使用 hooks
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDataBlockSourceId(props);
  }
};

/**
 * @deprecated use `DataBlockProvider` instead
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
  const { name, dataSource, association, useParams, parentRecord } = props;
  const sourceId = useCompatDataBlockSourceId(props);
  const { templateFinshed } = useTemplateBlockContext();

  // 新版（1.0）已弃用 useParams，这里之所以继续保留是为了兼容旧版的 UISchema
  const paramsFromHook = useParams?.();

  const { getAssociationAppends } = useAssociationNames(dataSource);
  const { appends, updateAssociationValues } = getAssociationAppends();
  const params = useMemo(() => {
    if (!props.params?.['appends']) {
      return { ...props.params, appends, ...paramsFromHook };
    }
    return { ...props.params, ...paramsFromHook };
  }, [appends, paramsFromHook, props.params, templateFinshed]);
  const blockValue = useMemo(() => ({ name }), [name]);

  return (
    <BlockContext.Provider value={blockValue}>
      <DataBlockProvider
        {...(props as any)}
        params={params}
        sourceId={sourceId}
        // 此处是针对树表格的 Add child 按钮优化的，因为点击 Add child 打开的表单中需要用到父级的数据；
        // 但是当是关系区块时，在 DataBlockProvider 中会自动请求父级数据，所以这里不需要再传 parentRecord。
        // 具体问题记录在这里：https://nocobase.height.app/T-3235/description
        parentRecord={association ? undefined : parentRecord}
      >
        <BlockRequestProvider_deprecated {...props} updateAssociationValues={updateAssociationValues} params={params}>
          <DataBlockCollector {...props} params={params}>
            {props.children}
          </DataBlockCollector>
        </BlockRequestProvider_deprecated>
      </DataBlockProvider>
    </BlockContext.Provider>
  );
};

export const useBlockAssociationContext = () => {
  const { association } = useDataBlockProps();
  return useContext(BlockAssociationContext) || association;
};

export const useFilterByTk = () => {
  const { resource, __parent } = useBlockRequestContext();
  const recordIndex = useRecordIndex();
  const record = useRecord();
  const collection = useCollection_deprecated();
  const { getCollectionField } = useCollectionManager_deprecated();
  const assoc = useBlockAssociationContext();
  const withoutTableFieldResource = useContext(WithoutTableFieldResource);
  if (!withoutTableFieldResource) {
    if (resource instanceof TableFieldResource || __parent?.block === 'TableField') {
      return recordIndex;
    }
  }

  if (assoc) {
    const association = getCollectionField(assoc);
    return record?.[association.targetKey || 'id'];
  }
  return record?.[collection.filterTargetKey || 'id'];
};

/**
 * @deprecated
 * 已弃用，应使用 useSourceIdFromParentRecord
 * @returns
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

export const useSourceIdFromParentRecord = () => {
  const cm = useCollectionManager();
  const parentRecordData = useCollectionParentRecordData();
  const { getCollectionField } = useCollectionManager_deprecated();
  const association = useBlockAssociationContext();
  if (association) {
    const collectionField = getCollectionField(association);
    const collection = cm.getCollection(collectionField.collectionName);
    return parentRecordData?.[
      collectionField.sourceKey || collection.filterTargetKey || collection.getPrimaryKey() || 'id'
    ];
  }
};

export const useParamsFromRecord = () => {
  const filterByTk = useFilterByTk();
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
