import { GeneralSchemaDesigner, useCollection, useSchemaTemplate } from '@nocobase/client';
import React from 'react';
export const CalendarDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="blockSettings:calendar"
      template={template}
      title={title || name}
    ></GeneralSchemaDesigner>
  );
};
