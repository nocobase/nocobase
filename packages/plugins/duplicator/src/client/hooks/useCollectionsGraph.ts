import { useCallback } from 'react';
import { useCollectionManager } from '@nocobase/client';
import { CollectionsGraph } from '@nocobase/utils/client';

const excludeCollections = ['users', 'roles', 'applications'];

export const useCollectionsGraph = () => {
  const { collections } = useCollectionManager();

  const findAddable = useCallback((name: string) => {
    return CollectionsGraph.connectedNodes({
      collections,
      nodes: [name],
      excludes: excludeCollections,
    });
  }, []);

  const findRemovable = useCallback((name: string) => {
    return CollectionsGraph.connectedNodes({
      collections,
      nodes: [name],
      excludes: excludeCollections,
      direction: 'reverse',
    });
  }, []);

  return {
    findAddable,
    findRemovable,
  };
};
