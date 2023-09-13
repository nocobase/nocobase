import { RecursionField } from '@formily/react';
import { CollectionManagerProvider, SchemaComponentOptions, useCurrentRoles } from '@nocobase/client';
import React from 'react';
import apiKeysCollection from '../../collections';
import { ExpiresSelect } from './ExpiresSelect';
import { configurationSchema } from './schema';

export const Configuration = () => {
  const currentRoles = useCurrentRoles();

  return (
    <CollectionManagerProvider collections={[apiKeysCollection]}>
      <SchemaComponentOptions scope={{ currentRoles }} components={{ ExpiresSelect }}>
        <RecursionField schema={configurationSchema} />
      </SchemaComponentOptions>
    </CollectionManagerProvider>
  );
};
