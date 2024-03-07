import { createContext } from 'react';

export const CollectionCategroriesContext = createContext({ data: [], refresh: () => {} });
CollectionCategroriesContext.displayName = 'CollectionCategroriesContext';
