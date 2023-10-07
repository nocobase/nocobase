import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider';
import { useDetailsBlockContext } from '../../../block-provider/DetailsBlockProvider';
import { useCollection } from '../../../collection-manager';
import { useSortFields } from '../../../collection-manager/action-hooks';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useDesignable } from '../../hooks';
import { removeNullCondition } from '../filter';

export const FormDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  const { action } = useFormBlockContext();

  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      {/* <SchemaSettings.Template componentName={'FormItem'} collectionName={name} /> */}
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.LinkageRules collectionName={name} />
      {/* 当 action 没有值的时候，说明是在用表单创建新数据，此时需要显示数据模板 */}
      {!action ? <SchemaSettings.DataTemplates collectionName={name} /> : null}
      <SchemaSettings.Divider />
      <SchemaSettings.FormItemTemplate
        componentName={'FormItem'}
        collectionName={name}
        resourceName={defaultResource}
      />
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

export const ReadPrettyFormDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const fieldSchema = useFieldSchema();
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      {/* <SchemaSettings.Template componentName={'ReadPrettyForm'} collectionName={name} /> */}
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.FormItemTemplate
        insertAdjacentPosition={'beforeEnd'}
        componentName={'ReadPrettyFormItem'}
        collectionName={name}
        resourceName={defaultResource}
      />
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

export const DetailsDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const field = useField();
  const { service } = useDetailsBlockContext();
  const { dn } = useDesignable();
  const sortFields = useSortFields(name);
  const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
  const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
  const sort = defaultSort?.map((item: string) => {
    return item.startsWith('-')
      ? {
          field: item.substring(1),
          direction: 'desc',
        }
      : {
          field: item,
          direction: 'asc',
        };
  });
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      <SchemaSettings.BlockTitleItem />
      <SchemaSettings.DataScope
        collectionName={name}
        defaultFilter={fieldSchema?.['x-decorator-props']?.params?.filter || {}}
        form={form}
        onSubmit={({ filter }) => {
          filter = removeNullCondition(filter);
          const params = field.decoratorProps.params || {};
          params.filter = filter;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          service.run({ ...service.params?.[0], filter });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.ModalItem
        title={t('Set default sorting rules')}
        components={{ ArrayItems }}
        schema={
          {
            type: 'object',
            title: t('Set default sorting rules'),
            properties: {
              sort: {
                type: 'array',
                default: sort,
                'x-component': 'ArrayItems',
                'x-decorator': 'FormItem',
                items: {
                  type: 'object',
                  properties: {
                    space: {
                      type: 'void',
                      'x-component': 'Space',
                      properties: {
                        sort: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.SortHandle',
                        },
                        field: {
                          type: 'string',
                          enum: sortFields,
                          required: true,
                          'x-decorator': 'FormItem',
                          'x-component': 'Select',
                          'x-component-props': {
                            style: {
                              width: 260,
                            },
                          },
                        },
                        direction: {
                          type: 'string',
                          'x-decorator': 'FormItem',
                          'x-component': 'Radio.Group',
                          'x-component-props': {
                            optionType: 'button',
                          },
                          enum: [
                            {
                              label: t('ASC'),
                              value: 'asc',
                            },
                            {
                              label: t('DESC'),
                              value: 'desc',
                            },
                          ],
                        },
                        remove: {
                          type: 'void',
                          'x-decorator': 'FormItem',
                          'x-component': 'ArrayItems.Remove',
                        },
                      },
                    },
                  },
                },
                properties: {
                  add: {
                    type: 'void',
                    title: t('Add sort field'),
                    'x-component': 'ArrayItems.Addition',
                  },
                },
              },
            },
          } as ISchema
        }
        onSubmit={({ sort }) => {
          const sortArr = sort.map((item) => {
            return item.direction === 'desc' ? `-${item.field}` : item.field;
          });
          const params = field.decoratorProps.params || {};
          params.sort = sortArr;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
          service.run({ ...service.params?.[0], sort: sortArr });
        }}
      />
      <SchemaSettings.Template componentName={'Details'} collectionName={name} resourceName={defaultResource} />
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
