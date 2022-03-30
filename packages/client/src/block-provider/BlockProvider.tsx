import { useRequest } from 'ahooks';
import React, { createContext, useContext } from 'react';
import { useAPIClient, useRecord } from '../';
import { CollectionProvider, useCollection, useCollectionManager } from '../collection-manager';

export const BlockResourceContext = createContext(null);
export const BlockAssociationContext = createContext(null);

export const useBlockResource = () => {
  return useContext(BlockResourceContext);
};

interface UseReousrceProps {
  resource: any;
  association?: any;
  useSourceId?: any;
}

const useAssociation = (props) => {
  const { association } = props;
  const { getCollectionField } = useCollectionManager();
  if (typeof association === 'string') {
    return getCollectionField(association);
  } else if (association?.collectionName && association?.name) {
    return getCollectionField(`${association?.collectionName}.${association?.name}`);
  }
};

const useReousrce = (props: UseReousrceProps) => {
  const { resource, useSourceId } = props;
  const record = useRecord();
  const api = useAPIClient();
  const association = useAssociation(props);
  const sourceId = useSourceId?.();
  if (!association) {
    return api.resource(resource);
  }
  if (sourceId) {
    return api.resource(resource, sourceId);
  }
  return api.resource(resource, record[association?.sourceKey || 'id']);
};

const useActionParams = (props) => {
  const { useParams } = props;
  const params = useParams?.() || {};
  return { ...props.params, ...params };
};

export const useResourceAction = (props, opts = {}) => {
  const { resource, action } = props;
  const params = useActionParams(props);
  const options = {
    ...opts,
    defaultParams: [params],
    // manual: true,
  };
  const result = useRequest(
    (params) => (action ? resource[action](params).then((res) => res.data) : Promise.resolve({})),
    options,
  );
  return result;
};

const MaybeCollectionProvider = (props) => {
  const { collection } = props;
  return collection ? (
    <CollectionProvider collection={collection}>{props.children}</CollectionProvider>
  ) : (
    <>{props.children}</>
  );
};

const BlockRequestContext = createContext(null);

const BlockRequestProvider = (props) => {
  const resource = useBlockResource();
  const service = useResourceAction(
    { ...props, resource },
    {
      ...props.requestOptions,
    },
  );
  return <BlockRequestContext.Provider value={{ service, resource }}>{props.children}</BlockRequestContext.Provider>;
};

export const useBlockRequestContext = () => {
  return useContext(BlockRequestContext);
};

export const BlockProvider = (props) => {
  const { collection, association } = props;
  const resource = useReousrce(props);
  return (
    <MaybeCollectionProvider collection={collection}>
      <BlockAssociationContext.Provider value={association}>
        <BlockResourceContext.Provider value={resource}>
          <BlockRequestProvider {...props}>{props.children}</BlockRequestProvider>
        </BlockResourceContext.Provider>
      </BlockAssociationContext.Provider>
    </MaybeCollectionProvider>
  );
};

export const useBlockAssociationContext = () => {
  return useContext(BlockAssociationContext);
};

export const useFilterByTk = () => {
  const record = useRecord();
  const collection = useCollection();
  const { getCollectionField } = useCollectionManager();
  const assoc = useContext(BlockAssociationContext);
  if (assoc) {
    const association = getCollectionField(assoc);
    return record?.[association.targetKey || 'id'];
  }
  return record?.[collection.filterTargetKey || 'id'];
};

export const useSourceIdFromRecord = () => {
  const record = useRecord();
  const { getCollectionField } = useCollectionManager();
  const assoc = useContext(BlockAssociationContext);
  if (assoc) {
    const association = getCollectionField(assoc);
    return record?.[association.sourceKey || 'id'];
  }
};

export const useSourceIdFromParentRecord = () => {
  const record = useRecord();
  const { getCollectionField } = useCollectionManager();
  const assoc = useContext(BlockAssociationContext);
  if (assoc) {
    const association = getCollectionField(assoc);
    return record?.__parent?.[association.sourceKey || 'id'];
  }
};

export const useParamsFromRecord = () => {
  const filterByTk = useFilterByTk();
  return {
    filterByTk,
  };
};
