import React from 'react';
import { useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useCompile, useDesignable } from '../../hooks';

export const AssociationFieldsFilterInnerItemDesigner = (props) => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { getCollectionFields } = useCollectionManager();
  const compile = useCompile();
  const { dn } = useDesignable();

  const targetFields = getCollectionFields(fieldSchema['x-designer-props'].target) ?? [];

  const options = targetFields
    .filter(
      (field) => field?.interface && ['id', 'input', 'phone', 'email', 'integer', 'number'].includes(field?.interface),
    )
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));

  const onTitleFieldChange = (label) => {
    const schema = {
      ['x-uid']: fieldSchema['x-uid'],
    };
    const fieldNames = {
      label,
    };
    fieldSchema['x-designer-props'] = fieldSchema['x-designer-props'] || {};
    fieldSchema['x-designer-props']['fieldNames'] = fieldNames;
    schema['x-designer-props'] = fieldSchema['x-designer-props'];
    dn.emit('patch', {
      schema,
    });
    dn.refresh();
  };

  return (
    <GeneralSchemaDesigner {...props} disableInitializer={true}>
      <SchemaSettings.SelectItem
        key="title-field"
        title={t('Title field')}
        options={options}
        value={fieldSchema['x-designer-props']?.fieldNames?.label}
        onChange={onTitleFieldChange}
      />
      <SchemaSettings.Remove
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
