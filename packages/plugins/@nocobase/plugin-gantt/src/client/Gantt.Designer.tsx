import React from 'react';
import { GeneralSchemaDesigner, useCollectionV2, useSchemaTemplate } from '@nocobase/client';
export const GanttDesigner = () => {
  const collection = useCollectionV2();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="GanttBlockSettings"
      template={template}
      title={collection.title || collection.name}
    ></GeneralSchemaDesigner>
  );
};
