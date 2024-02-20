import React from 'react';
import { useCollection_deprecated, GeneralSchemaDesigner, useSchemaTemplate } from '@nocobase/client';
export const GanttDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="GanttBlockSettings"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
