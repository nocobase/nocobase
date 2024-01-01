import React from 'react';
import { GeneralSchemaDesigner } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useCollectionV2 } from '../../../application';

export const FormDesigner = () => {
  const collection = useCollectionV2();
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner
      schemaSettings="FormSettings"
      template={template}
      title={collection.title || collection.name}
    ></GeneralSchemaDesigner>
  );
};

export const ReadPrettyFormDesigner = () => {
  const collection = useCollectionV2();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner
      schemaSettings="ReadPrettyFormSettings"
      template={template}
      title={collection.title || collection.name}
    ></GeneralSchemaDesigner>
  );
};

export const DetailsDesigner = () => {
  const collection = useCollectionV2();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner
      schemaSettings="FormDetailsSettings"
      template={template}
      title={collection.title || collection.name}
    ></GeneralSchemaDesigner>
  );
};
