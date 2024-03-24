import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection_deprecated } from '../../../collection-manager';
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

export const AssociationFilterBlockDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const defaultResource =
    fieldSchema?.['x-decorator-props']?.resource || fieldSchema?.['x-decorator-props']?.association;

  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
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
