import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection } from '../../../collection-manager';
import { FilterBlockType } from '../../../filter-provider/utils';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

export const AssociationFilterBlockDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;

  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.Template componentName={'FilterCollapse'} collectionName={name} resourceName={defaultResource} />
      <SchemaSettings.ConnectDataBlocks type={FilterBlockType.COLLAPSE} emptyDescription={t('No blocks to connect')} />
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
