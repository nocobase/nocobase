import { RecursionField } from '@formily/react';
import { CollectionManagerProvider } from '@nocobase/client';
import React from 'react';
import { apiKeysCollection } from '../../collections';
import { configurationSchema } from './schema';

export const Configuration = () => {
  return (
    <CollectionManagerProvider collections={[apiKeysCollection]}>
      <RecursionField schema={configurationSchema} />
    </CollectionManagerProvider>
  );
};
