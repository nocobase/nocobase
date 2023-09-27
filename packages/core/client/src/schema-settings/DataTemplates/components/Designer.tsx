import { Field } from '@formily/core';
import { ISchema, observer, useField, useFieldSchema } from '@formily/react';
import { error } from '@nocobase/utils/client';
import { Select } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GeneralSchemaDesigner, SchemaSettings } from '../..';
import { mergeFilter } from '../../../block-provider';
import { useCollectionFilterOptions, useCollectionManager } from '../../../collection-manager';
import { removeNullCondition, useCompile, useDesignable } from '../../../schema-component';
import { ITemplate } from '../../../schema-component/antd/form-v2/Templates';
import { FilterDynamicComponent } from '../../../schema-component/antd/table-v2/FilterDynamicComponent';

export const Designer = observer(
  () => {
    const { getCollectionFields, getCollectionField, getCollection, isTitleField } = useCollectionManager();
    const field = useField<Field>();
    const fieldSchema = useFieldSchema();
    const { t } = useTranslation();
    const { dn } = useDesignable();
    const compile = useCompile();
    const { formSchema, data } = fieldSchema['x-designer-props'] as {
      formSchema: ISchema;
      data?: ITemplate;
    };

    // 在这里读取 resource 的值，当 resource 变化时，会触发该组件的更新
    const collectionName = field.componentProps.service.resource;

    const collection = getCollection(collectionName);
    const collectionFields = getCollectionFields(collectionName);
    const dataSource = useCollectionFilterOptions(collectionName);

    if (!data) {
      error('data is required');
      return null;
    }

    const getFilter = () => data.config?.[collectionName]?.filter || {};
    const setFilter = (filter) => {
      try {
        _.set(data, `config.${collectionName}.filter`, removeNullCondition(filter));
      } catch (err) {
        error(err);
      }
    };
    const getTitleFIeld = () => data.config?.[collectionName]?.titleField || collection?.titleField || 'id';
    const setTitleField = (titleField) => {
      try {
        _.set(data, `config.${collectionName}.titleField`, titleField);
      } catch (err) {
        error(err);
      }
    };

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
          schema={
            {
              type: 'object',
              title: t('Set the data scope'),
              properties: {
                filter: {
                  default: getFilter(),
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
            setFilter(filter);

            try {
              // 不仅更新当前模板，也更新同级的其它模板
              field.query('fieldReaction.items.*.layout.dataId').forEach((item) => {
                if (item.componentProps.service.resource !== collectionName) {
                  return;
                }

                item.componentProps.service.params = {
                  filter: _.isEmpty(filter)
                    ? {}
                    : removeNullCondition(mergeFilter([filter, getSelectedIdFilter(field.value)], '$or')),
                };
              });
            } catch (err) {
              error(err);
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
          value={getTitleFIeld()}
          onChange={(label) => {
            setTitleField(label);

            try {
              // 不仅更新当前模板，也更新同级的其它模板
              field.query('fieldReaction.items.*.layout.dataId').forEach((item) => {
                if (item.componentProps.service.resource !== collectionName) {
                  return;
                }

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
  },
  { displayName: 'Designer' },
);

export function getSelectedIdFilter(selectedId) {
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
          data-testid="antd-select"
          popupMatchSelectWidth={false}
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
