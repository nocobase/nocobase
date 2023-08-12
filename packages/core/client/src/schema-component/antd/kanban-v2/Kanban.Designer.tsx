import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../..';
import { useAPIClient } from '../../../api-client';
import { useKanbanV2BlockContext } from '../../../block-provider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { useCollectionFilterOptions } from '../../../collection-manager/action-hooks';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

export const KanabanDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { name, title } = useCollection();
  const dataSource = useCollectionFilterOptions(name);
  const { service } = useKanbanV2BlockContext();
  const api = useAPIClient();
  const { getCollectionFields, getCollectionFieldsOptions } = useCollectionManager();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const template = useSchemaTemplate();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.params?.filter || {};
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  const displayLable = fieldSchema['x-label-disabled'] === undefined ? true : fieldSchema['x-label-disabled'];
  const collectionFields = getCollectionFields(name);
  const groupFieldsOptions = getCollectionFieldsOptions(name, 'string', {
    association: ['linkTo', 'm2m', 'm2o', 'o2m', 'o2o', 'oho'],
  }).filter((v) => v.children || ['select', 'radioGroup'].includes(v.interface));
  const groupField = fieldSchema['x-decorator-props']?.groupField || [];
  const columns = fieldSchema['x-decorator-props']?.columns;
  const getAssociateResource = (collectionName) => {
    return api.resource(collectionName);
  };
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.ModalItem
        title={t('Grouping field')}
        scope={{ collectionFields, getAssociateResource, columns }}
        schema={
          {
            type: 'object',
            title: t('Grouping field'),
            properties: {
              groupField: {
                title: t('Grouping field'),
                enum: groupFieldsOptions,
                required: true,
                default: groupField,
                'x-disabled': true,
                description: '{{t("Single select and radio fields can be used as the grouping field")}}',
                'x-component': 'Cascader',
                'x-component-props': {
                  objectValue: true,
                  fieldNames: { label: 'label', value: 'value' },
                },
                'x-decorator': 'FormItem',
              },
              options: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'KanbanOptions',
                'x-component-props': {
                  name,
                },
                'x-reactions': {
                  dependencies: ['groupField'],
                  fulfill: {
                    schema: {
                      'x-component-props': '{{{getAssociateResource,columns,collectionFields,...$form.values}}}',
                    },
                  },
                },
              },
            },
          } as ISchema
        }
        initialValues={{}}
        onSubmit={async (values) => {
          const decoratorProps = field.decoratorProps || {};
          decoratorProps.columns = values.options;
          field.decoratorProps = decoratorProps;
          fieldSchema['x-decorator-props']['columns'] = values.options;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': field.decoratorProps,
            },
          });
          dn.refresh();
        }}
      />
      <SchemaSettings.SelectItem
        title={t('Records per page')}
        value={field.decoratorProps?.params?.pageSize || 10}
        options={[
          { label: '10', value: 10 },
          { label: '20', value: 20 },
          { label: '50', value: 50 },
          { label: '100', value: 100 },
          { label: '200', value: 200 },
        ]}
        onChange={(pageSize) => {
          const params = field.decoratorProps.params || {};
          params.pageSize = pageSize;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          service.run({ ...service.params?.[0], pageSize, page: 1 });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.ModalItem
        title={t('Set the data scope')}
        schema={
          {
            type: 'object',
            title: t('Set the data scope'),
            properties: {
              filter: {
                default: defaultFilter,
                enum: dataSource,
                'x-component': 'Filter',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        initialValues={
          {
            // title: field.title,
            // icon: field.componentProps.icon,
          }
        }
        onSubmit={({ filter }) => {
          const params = field.decoratorProps.params || {};
          params.filter = filter;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          service.run({ ...service?.params?.[0], filter });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': field.decoratorProps,
            },
          });
        }}
      />
      <SchemaSettings.Divider />
      <SchemaSettings.Template componentName={'KanbanV2'} collectionName={name} resourceName={defaultResource} />
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
