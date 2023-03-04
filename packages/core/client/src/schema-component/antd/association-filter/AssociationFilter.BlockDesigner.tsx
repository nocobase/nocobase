import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useCollection } from '../../../collection-manager';
import { FilterBlockType } from '../../../filter-provider/utils';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

export const AssociationFilterBlockDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;

  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.FormItemTemplate
        componentName={'FormItem'}
        collectionName={name}
        resourceName={defaultResource}
      />
      <SchemaSettings.ConnectDataBlocks type={FilterBlockType.COLLAPSE} />
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
