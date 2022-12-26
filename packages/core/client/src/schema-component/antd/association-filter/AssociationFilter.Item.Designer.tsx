import { ISchema, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useCompile, useDesignable } from '../../hooks';
import { AssociationFilter } from './AssociationFilter';

export const AssociationFilterItemDesigner = (props) => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const collectionField = AssociationFilter.useAssociationField();

  const { getCollectionFields } = useCollectionManager();
  const compile = useCompile();
  const { dn } = useDesignable();

  const targetFields = getCollectionFields(collectionField.target) ?? [];

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
    fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
    fieldSchema['x-component-props']['fieldNames'] = fieldNames;
    schema['x-component-props'] = fieldSchema['x-component-props'];
    dn.emit('patch', {
      schema,
    });
    dn.refresh();
  };

  return (
    <GeneralSchemaDesigner {...props} disableInitializer={true}>
      <SchemaSettings.ModalItem
        title={t('Custom title')}
        schema={
          {
            type: 'object',
            title: t('Custom title'),
            properties: {
              title: {
                default: fieldSchema?.title,
                description: `${t('Original title: ')}${collectionField?.uiSchema?.title || fieldSchema?.title}`,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        onSubmit={({ title }) => {
          if (title) {
            // field.title = title;
            fieldSchema.title = title;
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                title: fieldSchema.title,
              },
            });
          }
          dn.refresh();
        }}
      />
      <SchemaSettings.SelectItem
        key="title-field"
        title={t('Title field')}
        options={options}
        value={fieldSchema['x-component-props']?.fieldNames?.label}
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
