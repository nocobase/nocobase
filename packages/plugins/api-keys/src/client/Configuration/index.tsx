import { RecursionField } from '@formily/react';
import { CollectionManagerProvider, SchemaComponentOptions, useCurrentRoles } from '@nocobase/client';
import React from 'react';
import { apiKeysCollection } from '../../collections';
import { configurationSchema } from './schema';

export const Configuration = () => {
  const currentRoles = useCurrentRoles();

  return (
    <CollectionManagerProvider collections={[apiKeysCollection]}>
      <SchemaComponentOptions scope={{ currentRoles }}>
        <RecursionField schema={configurationSchema} />
      </SchemaComponentOptions>
    </CollectionManagerProvider>
  );
};
