import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBlockType } from '../../../filter-provider/utils';
import {
  GeneralSchemaDesigner,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
  SchemaSettingsTemplate,
} from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useCollectionV2 } from '../../../application';

export const AssociationFilterBlockDesigner = () => {
  const collection = useCollectionV2();
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;

  return (
    <GeneralSchemaDesigner template={template} title={collection.title || collection.name}>
      <SchemaSettingsBlockTitleItem />
      <SchemaSettingsTemplate componentName={'FilterCollapse'} collectionName={name} resourceName={defaultResource} />
      <SchemaSettingsConnectDataBlocks type={FilterBlockType.COLLAPSE} emptyDescription={t('No blocks to connect')} />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
