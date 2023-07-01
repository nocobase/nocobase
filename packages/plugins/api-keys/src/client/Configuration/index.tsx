import { RecursionField } from '@formily/react';
import { CollectionManagerProvider, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { apiKeysCollection } from '../../collections';
import { useCurrentRolesProps } from './roles';
import { configurationSchema } from './schema';

export const Configuration = () => {
  return (
    <CollectionManagerProvider collections={[apiKeysCollection]}>
      <SchemaComponentOptions scope={{ useCurrentRolesProps }}>
        <RecursionField schema={configurationSchema} />
      </SchemaComponentOptions>
    </CollectionManagerProvider>
  );
};
