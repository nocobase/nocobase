import { ISchema, useField, useFieldSchema } from '@formily/react';
import { ArrayItems } from '@formily/antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { mergeFilter } from '../../../block-provider/SharedFilterProvider';
import { useCollectionFilterOptions, useCollectionManager, useSortFields } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useCompile, useDesignable } from '../../hooks';
import { AssociationItemContext } from './Association.Item.Decorator';
import { AssociationFilter } from './AssociationFilter';

export const AssociationFilterItemDesigner = (props) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { t } = useTranslation();
  const { service: associationItemService } = useContext(AssociationItemContext);
  const targetCollection = fieldSchema?.['x-target'];
  const dataSource = useCollectionFilterOptions(targetCollection);
  const defaultFilter = fieldSchema?.['x-decorator-props']?.params?.filter || {};

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

  const sortFields = useSortFields(targetCollection);
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
        onSubmit={({ filter }) => {
          const params = field.decoratorProps.params || {};
          params.filter = filter;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          const filters = associationItemService.params?.[1]?.filters || {};
          associationItemService.run(
            {
              ...associationItemService.params?.[0],
              filter: mergeFilter([...Object.values(filters), filter]),
              page: 1,
            },
            { filters },
          );
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
      />
      <SchemaSettings.DefaultSortingRules
        sort={sort}
        sortFields={sortFields}
        onSubmit={({ sort }) => {
          const sortArr = sort.map((item) => {
            return item.direction === 'desc' ? `-${item.field}` : item.field;
          });
          const params = field.decoratorProps.params || {};
          params.sort = sortArr;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          dn.emit('patch', {
            schema: fieldSchema,
          });
          associationItemService.run({ ...associationItemService.params?.[0], sort: sortArr });
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
