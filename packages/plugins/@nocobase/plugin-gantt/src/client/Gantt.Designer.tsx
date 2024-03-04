import { GeneralSchemaDesigner, useCollection_deprecated, useSchemaTemplate } from '@nocobase/client';
import React from 'react';
export const GanttDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="blockSettings:gantt"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
