import React from 'react';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

export const FormDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const ctx = useFormBlockContext();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.Template componentName={ctx?.action ? 'RecordForm' : 'CreateForm'} collectionName={name} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export const ReadPrettyFormDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.Template componentName={'ReadPrettyForm'} collectionName={name} />
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
