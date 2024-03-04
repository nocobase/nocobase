import { GeneralSchemaDesigner, useCollection, useSchemaTemplate } from '@nocobase/client';
import React from 'react';
export const MapBlockDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="blockSettings:map"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
