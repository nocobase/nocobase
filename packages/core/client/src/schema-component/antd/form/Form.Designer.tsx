import React from 'react';
import { GeneralSchemaDesigner } from '../../../schema-settings';
import { useCollectionV2 } from '../../../application';

export const FormDesigner = () => {
  const collection = useCollectionV2();
  return (
    <GeneralSchemaDesigner
      schemaSettings="FormV1Settings"
      title={collection.title || collection.name}
    ></GeneralSchemaDesigner>
  );
};
