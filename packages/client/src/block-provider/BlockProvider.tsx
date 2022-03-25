import { useRequest } from 'ahooks';
import React, { createContext, useContext } from 'react';
import { useAPIClient, useRecord } from '../';
import { CollectionProvider, useCollectionManager } from '../collection-manager';

export const BlockResourceContext = createContext(null);
export const BlockAssociationContext = createContext(null);

export const useBlockResource = () => {
  return useContext(BlockResourceContext);
};

interface UseReousrceProps {
  resource: any;
  association?: any;
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
  const { resource } = props;
  const record = useRecord();
  const api = useAPIClient();
  const association = useAssociation(props);
  if (!association) {
    return api.resource(resource);
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

export const BlockProvider = (props) => {
  const { collection, association } = props;
  const resource = useReousrce(props);
  return (
    <MaybeCollectionProvider collection={collection}>
      <BlockAssociationContext.Provider value={association}>
        <BlockResourceContext.Provider value={resource}>{props.children}</BlockResourceContext.Provider>
      </BlockAssociationContext.Provider>
    </MaybeCollectionProvider>
  );
};

export const useFilterByTk = () => {
  const record = useRecord();
  return record.id;
};

export const useParamsFromRecord = () => {
  const filterByTk = useFilterByTk();
  return {
    filterByTk,
  };
};
