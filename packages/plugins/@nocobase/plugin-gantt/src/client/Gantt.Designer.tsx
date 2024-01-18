import { GeneralSchemaDesigner, useCollection, useSchemaTemplate } from '@nocobase/client';
import React from 'react';
export const GanttDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="blockSettings:gantt"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
