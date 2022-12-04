import { createContext } from 'react';
import * as defaultInterfaces from './interfaces';
import { CollectionFieldOptions, CollectionManagerOptions, CollectionOptions } from './types';

export const CollectionManagerContext = createContext<CollectionManagerOptions>({
  collections: [],
  interfaces: defaultInterfaces,
});

export const CollectionContext = createContext<CollectionOptions>({});

export const CollectionFieldContext = createContext<CollectionFieldOptions>({});
