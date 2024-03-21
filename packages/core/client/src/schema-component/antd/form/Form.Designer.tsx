import React from 'react';
import { useCollection_deprecated } from '../../../collection-manager';
import { GeneralSchemaDesigner } from '../../../schema-settings';

export const FormDesigner = () => {
  const { name, title } = useCollection_deprecated();
  return <GeneralSchemaDesigner schemaSettings="FormV1Settings" title={title || name}></GeneralSchemaDesigner>;
};
