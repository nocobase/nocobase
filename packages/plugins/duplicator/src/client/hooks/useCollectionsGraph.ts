import { CollectionsGraph } from '@nocobase/utils/client';
import { useCallback } from 'react';

const excludeCollections = ['users', 'roles', 'applications'];

export const useCollectionsGraph = ({ collections = [] }) => {
  const findAddable = useCallback((name: string) => {
    return CollectionsGraph.connectedNodes({
      collections,
      nodes: [name],
      excludes: excludeCollections,
    });
  }, [collections]);

  const findRemovable = useCallback((name: string) => {
    return CollectionsGraph.connectedNodes({
      collections,
      nodes: [name],
      excludes: excludeCollections,
      direction: 'reverse',
    });
  }, [collections]);

  return {
    findAddable,
    findRemovable,
  };
};
