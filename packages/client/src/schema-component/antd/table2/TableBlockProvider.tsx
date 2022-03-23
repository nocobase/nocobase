import { useAPIClient, useRecord } from '@nocobase/client';
import { useRequest } from 'ahooks';
import React, { createContext, useContext } from 'react';
import { CollectionProvider, useCollection } from '../../../collection-manager';

export const TableBlockContext = createContext<any>({});

const ResourceContext = createContext(null);
const AssociationContext = createContext(null);

interface UseReousrceProps {
  resource: any;
  association?: any;
}

const useAssociation = (props) => {
  const { association } = props;
  const { getField } = useCollection();
  if (typeof association === 'string') {
    return getField(association);
  } else if (association?.name) {
    return getField(association?.name);
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

const useResourceAction = (props) => {
  const { resource, action, params } = props;
  const result = useRequest((params) => (action ? resource[action](params) : Promise.resolve({})), {
    defaultParams: [params],
  });
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

const InternalTableBlock = (props) => {
  const resource = useContext(ResourceContext);
  const service = useResourceAction({ ...props, resource });
  return <TableBlockContext.Provider value={{ service }}></TableBlockContext.Provider>;
};

export const BlockDecorator = (props) => {
  const { collection, association } = props;
  const resource = useReousrce(props);
  return (
    <MaybeCollectionProvider collection={collection}>
      <AssociationContext.Provider value={association}>
        <ResourceContext.Provider value={resource}>{props.children}</ResourceContext.Provider>
      </AssociationContext.Provider>
    </MaybeCollectionProvider>
  );
};

export const TableBlockProvider = (props) => {
  const { action, params } = props;
  return (
    <BlockDecorator {...props}>
      <InternalTableBlock action={action} params={params} />
    </BlockDecorator>
  );
};

export const useTableBlockContext = () => {
  return useContext(TableBlockContext);
};
