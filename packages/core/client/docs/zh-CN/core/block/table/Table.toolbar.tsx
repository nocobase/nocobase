import React from 'react';
import { SchemaToolbar, useCollectionV2 } from '@nocobase/client';

export const TableToolbar = () => {
  const { name, title } = useCollectionV2();
  return <SchemaToolbar title={title || name} draggable={false} />;
};
