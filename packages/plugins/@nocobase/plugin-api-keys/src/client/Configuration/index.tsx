import { RecursionField } from '@formily/react';
import { CollectionExtendsProvider, SchemaComponentOptions, useCurrentRoles } from '@nocobase/client';
import React from 'react';
import apiKeysCollection from '../../collections/apiKeys';
import { ExpiresSelect } from './ExpiresSelect';
import { configurationSchema } from './schema';

export const Configuration = () => {
  const currentRoles = useCurrentRoles();

  return (
    <CollectionExtendsProvider collections={[apiKeysCollection]}>
      <SchemaComponentOptions scope={{ currentRoles }} components={{ ExpiresSelect }}>
        <RecursionField schema={configurationSchema} />
      </SchemaComponentOptions>
    </CollectionExtendsProvider>
  );
};
