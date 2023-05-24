import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralSchemaDesigner, SchemaSettings } from '../..';
import { useCollectionFilterOptions, useCollectionManager } from '../../../collection-manager';
import { isTitleField } from '../../../collection-manager/Configuration/CollectionFields';
import { removeNullCondition, useCompile, useDesignable } from '../../../schema-component';
import { ITemplate } from '../../../schema-component/antd/form-v2/Templates';
import { FilterDynamicComponent } from '../../../schema-component/antd/table-v2/FilterDynamicComponent';

export const Designer = () => {
  const { getCollectionFields, getCollectionField, getCollection } = useCollectionManager();
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const compile = useCompile();
  const { formSchema, data, collectionName } = fieldSchema['x-designer-props'] as {
    formSchema: ISchema;
    index: number;
    collectionName: string;
    data?: ITemplate;
  };
  const index = field.data;

  const collection = getCollection(collectionName);
  const collectionFields = getCollectionFields(collectionName);
  const dataSource = useCollectionFilterOptions(collectionName);

  const item = data?.items?.[index];

  if (!item) {
    return null;
  }

  const options = collectionFields
    .filter((field) => isTitleField(field))
    .map((field) => ({
      value: field?.name,
      label: compile(field?.uiSchema?.title) || field?.name,
    }));

  return (
    <GeneralSchemaDesigner draggable={false}>
      <SchemaSettings.ModalItem
        title={t('Set the data scope')}
        scope={{ item }}
        schema={
          {
            type: 'object',
            title: t('Set the data scope'),
            properties: {
              filter: {
                default: '{{ item.filter }}',
                // title: '数据范围',
                enum: dataSource,
                'x-component': 'Filter',
                'x-component-props': {
                  dynamicComponent: (props) => FilterDynamicComponent({ ...props }),
                },
              },
            },
          } as ISchema
        }
        onSubmit={({ filter }) => {
          filter = removeNullCondition(filter);
          item.filter = filter || {};
          try {
            field.componentProps.service.params = { filter: item.filter };
          } catch (err) {
            console.error(err);
          }
          formSchema['x-data-templates'] = data;
          dn.emit('patch', {
            schema: {
              ['x-uid']: formSchema['x-uid'],
              ['x-data-templates']: data,
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettings.SelectItem
        key="title-field"
        title={t('Title field')}
        options={options}
        value={item.titleField || collection?.titleField || 'id'}
        onChange={(label) => {
          item.titleField = label;
          try {
            field.componentProps.fieldNames.label = label;
            field.componentProps.targetField = getCollectionField(
              `${collectionName}.${label || collection?.titleField || 'id'}`,
            );
          } catch (err) {
            console.error(err);
          }
          formSchema['x-data-templates'] = data;

          const schema = {
            ['x-uid']: formSchema['x-uid'],
            ['x-data-templates']: data,
          };

          dn.emit('patch', {
            schema,
          });
          dn.refresh();
        }}
      />
    </GeneralSchemaDesigner>
  );
};
