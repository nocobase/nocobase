import {  useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTreeBlockContext } from '../../../block-provider';
import { useCollectionFilterOptions, useCollection } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { FixedBlockDesignerItem } from '../page';
import { FilterBlockType } from '../../../filter-provider/utils';

export const TreeDesigner = () => {
  const { name, title } = useCollection();
  const fieldSchema = useFieldSchema();
  const dataSource = useCollectionFilterOptions(name);
  const { service } = useTreeBlockContext();
  const { t } = useTranslation();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.AutoRefresh service={service} />
      <SchemaSettings.ConnectDataBlocks type={FilterBlockType.TREE} emptyDescription={t('No blocks to connect')} />
      <FixedBlockDesignerItem />
      <SchemaSettings.CustomRenderNode dataSource={dataSource} collectionName={name} fieldSchema={fieldSchema} />
       <SchemaSettings.AutoExpandParent />
      <SchemaSettings.Divider />
      <SchemaSettings.Template componentName={'FilterTree'} collectionName={name} resourceName={defaultResource} />
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
