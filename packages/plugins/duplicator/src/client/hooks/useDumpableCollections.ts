import { useAPIClient } from '@nocobase/client';
import { useEffect, useState } from 'react';

export interface Category {
  name: string;
  color: string;
  sort: number;
}

export interface CollectionData {
  key: string;
  name: string;
  title: string;
  inherits: string[];
  fields: string[];
  category: Category[];
  disabled?: boolean;
}

export interface GroupData {
  key: string;
  title: string;
  namespace: string;
  function: string;
  collections: CollectionData[];
  dumpable: 'required' | 'optional';
  disabled?: boolean;
}

interface Data {
  requiredGroups: GroupData[];
  optionalGroups: GroupData[];
  userCollections: CollectionData[];
}

export const useDumpableCollections = () => {
  const api = useAPIClient();
  const [data, setData] = useState<Data>({} as Data);

  useEffect(() => {
    api
      .request({
        resource: 'duplicator',
        action: 'dumpableCollections',
      })
      .then(({ data }) => {
        const { requiredGroups = [], optionalGroups = [], userCollections = [] } = data;
        requiredGroups.forEach((item) => {
          item.key = item.namespace;
          item.title = item.namespace;
          item.disabled = true;
        });
        optionalGroups.forEach((item) => {
          item.key = item.namespace;
          item.title = item.namespace;
        });
        userCollections.forEach((item) => {
          item.key = item.name;
        });
        setData(data);
      });
  }, []);

  return data;
};
