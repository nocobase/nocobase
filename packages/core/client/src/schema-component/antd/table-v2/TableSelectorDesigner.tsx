import { ArrayItems } from '@formily/antd-v5';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext, useTableSelectorContext } from '../../../block-provider';
import { recursiveParent } from '../../../block-provider/TableSelectorProvider';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../../../collection-manager';
import { useSortFields } from '../../../collection-manager/action-hooks';
import { useRecord } from '../../../record-provider';
import { useLocalVariables, useVariables } from '../../../variables';
import {
  GeneralSchemaDesigner,
  SchemaSettingsDivider,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSelectItem,
  SchemaSettingsSwitchItem,
} from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useDesignable } from '../../hooks';
import { removeNullCondition } from '../filter';
import { VariableInput, getShouldChange } from '../../../schema-settings/VariableInput/VariableInput';
import { RecordPickerContext } from '../../antd/record-picker';
import { SchemaSettingsDataScope } from '../../../schema-settings/SchemaSettingsDataScope';
import { SetDataLoadingMode } from '../../../modules/blocks/data-blocks/details-multi/setDataLoadingModeSettingsItem';

export const TableSelectorDesigner = () => {
  const { name, title } = useCollection_deprecated();
  const { getCollectionJoinField, getAllCollectionsInheritChain } = useCollectionManager_deprecated();

  const field = useField();
  const fieldSchema = useFieldSchema();
  const { form } = useFormBlockContext();
  const sortFields = useSortFields(name);
  const { service, extraFilter } = useTableSelectorContext();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const defaultSort = fieldSchema?.['x-decorator-props']?.params?.sort || [];
  const collectionFieldSchema = recursiveParent(fieldSchema, 'CollectionField');
  const collectionField = getCollectionJoinField(collectionFieldSchema?.['x-collection-field']);
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
  const template = useSchemaTemplate();
  const collection = useCollection_deprecated();
  const { dragSort } = field.decoratorProps;
  const record = useRecord();
  const variables = useVariables();
  const { currentFormCollection } = useContext(RecordPickerContext);
  const localVariables = useLocalVariables({ collectionName: currentFormCollection });
  return (
    <GeneralSchemaDesigner template={template} title={title || name} disableInitializer>
      <SchemaSettingsDataScope
        defaultFilter={fieldSchema?.['x-decorator-props']?.params?.filter || {}}
        form={form}
        onSubmit={({ filter }) => {
          filter = removeNullCondition(filter);
          const params = field.decoratorProps.params || {};
          params.filter = filter;
          field.decoratorProps.params = params;
          fieldSchema['x-decorator-props']['params'] = params;
          let serviceFilter = _.cloneDeep(filter);
          if (extraFilter) {
            if (serviceFilter) {
              serviceFilter = {
                $and: [extraFilter, serviceFilter],
              };
            } else {
              serviceFilter = extraFilter;
            }
          }
          service.run({ ...service.params?.[0], filter: serviceFilter, page: 1 });
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
        }}
        collectionName={name}
        dynamicComponent={(props) => {
          return (
            <VariableInput
              {...props}
              form={form}
              collectionField={props.collectionField}
              record={record}
              shouldChange={getShouldChange({
                collectionField: props.collectionField,
                variables,
                localVariables,
                getAllCollectionsInheritChain,
              })}
              currentFormCollectionName={currentFormCollection}
              currentIterationCollectionName={collectionField.collectionName}
            />
          );
        }}
      />
      {collection?.tree && collectionField?.target === collectionField?.collectionName && (
        <SchemaSettingsSwitchItem
          title={t('Tree table')}
          defaultChecked={true}
          checked={field.decoratorProps.treeTable !== false}
          onChange={(flag) => {
            field.form.clearFormGraph(`${field.address}.*`);
            field.decoratorProps.treeTable = flag;
            fieldSchema['x-decorator-props'].treeTable = flag;
            const params = {
              ...service.params?.[0],
              tree: flag ? true : null,
            };
            dn.emit('patch', {
              schema: fieldSchema,
            });
            dn.refresh();
            service.run(params);
          }}
        />
      )}
      <SetDataLoadingMode />
      {!dragSort && (
        <SchemaSettingsModalItem
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
      )}

      <SchemaSettingsSelectItem
        title={t('Records per page')}
        value={field.decoratorProps?.params?.pageSize || 20}
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
