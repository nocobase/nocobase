import React from 'react';
import { useCollection } from '../../../collection-manager';
import { GeneralSchemaDesigner } from '../../../schema-settings';

export const FormDesigner = () => {
  const { name, title } = useCollection();
  return <GeneralSchemaDesigner schemaSettings="FormV1Settings" title={title || name}></GeneralSchemaDesigner>;
};
