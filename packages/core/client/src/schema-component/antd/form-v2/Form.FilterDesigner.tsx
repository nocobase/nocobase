import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection } from '../../../collection-manager';
import { FilterBlockType } from '../../../filter-provider/utils';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

/**
 * 筛选区块所使用的表单设计器
 * @returns
 */
export const FilterDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;

  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.FormItemTemplate
        componentName={'FilterFormItem'}
        collectionName={name}
        resourceName={defaultResource}
      />
      <SchemaSettings.LinkageRules collectionName={name} />
      <SchemaSettings.ConnectDataBlocks type={FilterBlockType.FORM} emptyDescription={t('No blocks to connect')} />
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
