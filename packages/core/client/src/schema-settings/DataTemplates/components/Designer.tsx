import { Field } from '@formily/core';
import { ISchema, observer, useField, useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralSchemaDesigner, SchemaSettings } from '../..';
import { mergeFilter } from '../../../block-provider';
import { useCollectionFilterOptions, useCollectionManager } from '../../../collection-manager';
import { isTitleField } from '../../../collection-manager/Configuration/CollectionFields';
import { removeNullCondition, useCompile, useDesignable } from '../../../schema-component';
import { ITemplate } from '../../../schema-component/antd/form-v2/Templates';
import { FilterDynamicComponent } from '../../../schema-component/antd/table-v2/FilterDynamicComponent';

export const Designer = observer(() => {
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
  const collection = getCollection(collectionName);
  const collectionFields = getCollectionFields(collectionName);
  const dataSource = useCollectionFilterOptions(collectionName);

  if (!data) {
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
        scope={{ data }}
        schema={
          {
            type: 'object',
            title: t('Set the data scope'),
            properties: {
              filter: {
                default: '{{ data.filter }}',
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
          data.filter = mergeFilter([filter, getSelectedIdFilter(field.value)], '$or');

          try {
            // 不仅更新当前模板，也更新同级的其它模板
            field.query('fieldReaction.items.*.layout.dataId').forEach((item) => {
              item.componentProps.service.params = { filter: data.filter };
            });
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
      <SelectItem
        key="title-field"
        title={t('Title field')}
        options={options}
        value={data.titleField || collection?.titleField || 'id'}
        onChange={(label) => {
          data.titleField = label;
          try {
            // 不仅更新当前模板，也更新同级的其它模板
            field.query('fieldReaction.items.*.layout.dataId').forEach((item) => {
              item.componentProps.fieldNames.label = label;
              item.componentProps.targetField = getCollectionField(
                `${collectionName}.${label || collection?.titleField || 'id'}`,
              );
            });
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
});

function getSelectedIdFilter(selectedId) {
  return selectedId
    ? {
        id: {
          $eq: selectedId,
        },
      }
    : null;
}

function SelectItem(props) {
  const { title, options, value, onChange, ...others } = props;

  return (
    <SchemaSettings.Item {...others}>
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <Select
          bordered={false}
          value={value}
          onChange={onChange}
          options={options}
          style={{ textAlign: 'right', minWidth: 100 }}
          {...others}
        />
      </div>
    </SchemaSettings.Item>
  );
}
