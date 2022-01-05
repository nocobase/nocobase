import { useContext } from 'react';
import { CollectionManagerContext } from '../context';

export const useCollectionManager = () => {
  const { collections } = useContext(CollectionManagerContext);
  return {
    get(name: string) {
      return collections?.find((collection) => collection.name === name);
    },
  };
};
