import React from 'react';
import { SchemaToolbar, useCollectionV2 } from '@nocobase/client';

export const TableToolbar = () => {
  const collection = useCollectionV2();
  return <SchemaToolbar title={collection.title || collection.name} draggable={false} />;
};
