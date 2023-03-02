import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import {
  EditComponent,
  EditDescription,
  EditPattern,
  EditTitle,
  EditTitleField,
  EditTooltip,
  EditValidationRules,
} from './SchemaSettingOptions';

export const FilterFormDesigner = () => {
  const { getCollectionJoinField } = useCollectionManager();
  const { getField } = useCollection();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const collectionField = getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

  return (
    <GeneralSchemaDesigner>
      <EditTitle />
      <EditDescription />
      <EditTooltip />
      <EditValidationRules />
      <EditComponent />
      <EditPattern />
      <EditTitleField />
      {collectionField && <SchemaSettings.Divider />}
      <SchemaSettings.Remove
        key="remove"
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete field'),
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
