import { createContext } from 'react';
import { CollectionFieldOptions, CollectionManagerOptions, CollectionOptions } from './types';

export const CollectionManagerContext = createContext<CollectionManagerOptions>({
  collections: [],
  interfaces: {},
});

export const CollectionContext = createContext<CollectionOptions>({} as CollectionOptions);

export const CollectionFieldContext = createContext<CollectionFieldOptions>({});

export const CollectionCategroriesContext = createContext({ data: [], refresh: () => {} });
