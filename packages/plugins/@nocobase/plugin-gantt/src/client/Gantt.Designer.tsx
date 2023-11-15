import React from 'react';
import { useCollection, GeneralSchemaDesigner, useSchemaTemplate } from '@nocobase/client';
export const GanttDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="GanttBlockSettings"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
