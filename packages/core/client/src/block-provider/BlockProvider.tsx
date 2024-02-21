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
  useDataBlockProps,
  useDataBlockRequest,
  useDataBlockResource,
  useDesignable,
  useRecord_deprecated,
} from '../';
import { ACLCollectionProvider } from '../acl/ACLProvider';
import {
  CollectionProvider_deprecated,
  useCollectionManager_deprecated,
  useCollection_deprecated,
} from '../collection-manager';
import { DataBlockCollector } from '../filter-provider/FilterProvider';
import { useRecordIndex } from '../record-provider';
import { useAssociationNames } from './hooks';
import { useDataBlockSourceId } from './hooks/useDataBlockSourceId';

/**
 * @deprecated
 */
export const BlockResourceContext = createContext(null);
export const BlockAssociationContext = createContext(null);

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

export const useBlockResource = () => {
  const resource = useDataBlockResource();
  return useContext(BlockResourceContext) || resource;
};

interface UseResourceProps {
  resource: any;
  association?: any;
  useSourceId?: any;
  collection?: any;
  dataSource?: any;
  block?: any;
}

const useAssociation = (props) => {
  const { association } = props;
  const { getCollectionField } = useCollectionManager_deprecated();
  if (typeof association === 'string') {
    return getCollectionField(association);
  } else if (association?.collectionName && association?.name) {
    return getCollectionField(`${association?.collectionName}.${association?.name}`);
  }
};

const useActionParams = (props) => {
  const { useParams } = props;
  const params = useParams?.() || {};
  return { ...props.params, ...params };
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
      {props.children}
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

export const useBlockContext = () => {
  return useContext(BlockContext);
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
  /** @deprecated */
  useSourceId?: any;
  /** @deprecated */
  useParams?: any;
}) => {
  const { name, dataSource, association, useSourceId, useParams } = props;
  const sourceId = useDataBlockSourceId({ association, useSourceId });
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
      <DataBlockProvider {...(props as any)} params={params} sourceId={sourceId}>
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
  const record = useRecord_deprecated();
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

export const useSourceIdFromRecord = () => {
  const record = useRecord_deprecated();
  const { getCollectionField } = useCollectionManager_deprecated();
  const association = useBlockAssociationContext();
  if (association) {
    const collectionField = getCollectionField(association);
    return record?.[collectionField.sourceKey || 'id'];
  }
};

export const useSourceIdFromParentRecord = () => {
  const record = useRecord_deprecated();
  const { getCollectionField } = useCollectionManager_deprecated();
  const association = useBlockAssociationContext();
  if (association) {
    const collectionField = getCollectionField(association);
    return record?.__parent?.[collectionField.sourceKey || 'id'];
  }
};

export const useParamsFromRecord = () => {
  const filterByTk = useFilterByTk();
  const record = useRecord_deprecated();
  const { fields } = useCollection_deprecated();
  const fieldSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const collectionField = getCollectionJoinField(fieldSchema?.['x-decorator-props']?.resource);
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
  if (record.__collection && !['oho', 'm2o', 'obo'].includes(collectionField?.interface)) {
    obj['targetCollection'] = record.__collection;
  }
  if (!filterByTk) {
    obj['filter'] = filter;
  }
  return obj;
};

export const RecordLink = (props) => {
  const field = useField();
  const record = useRecord_deprecated();
  const { title, to, ...others } = props;
  const compiled = template(to || '');
  return (
    <Link {...others} to={compiled({ record: record || {} })}>
      {field.title}
    </Link>
  );
};
