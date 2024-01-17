import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { useCompile, useDesignable } from '../../../schema-component';
import { SchemaSettingsDataScope, SchemaSettingsDefaultSortingRules } from '../../../schema-settings';

export const filterCollapseItemFieldSettings = new SchemaSettings({
  name: 'fieldSettings:FilterCollapseItem',
  items: [
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Decorator options',
      },
      useChildren() {
        return [
          {
            name: 'customTitle',
            type: 'modal',
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const { t } = useTranslation();
              const { getCollectionJoinField } = useCollectionManager();
              const { getField } = useCollection();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
              const { dn } = useDesignable();

              return {
                title: t('Custom title'),
                schema: {
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
                } as ISchema,
                onSubmit: ({ title }) => {
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
                },
              };
            },
          },
          {
            name: 'defaultCollapse',
            type: 'switch',
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const field = useField();
              const { t } = useTranslation();
              const { dn } = useDesignable();

              return {
                title: t('Default collapse'),
                checked: field.componentProps.defaultCollapse,
                onChange: (v) => {
                  field.componentProps.defaultCollapse = v;
                  fieldSchema['x-component-props']['defaultCollapse'] = v;
                  dn.emit('patch', {
                    schema: {
                      ['x-uid']: fieldSchema['x-uid'],
                      'x-component-props': fieldSchema['x-component-props'],
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'setTheDataScope',
            Component: SchemaSettingsDataScope,
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const { form } = useFormBlockContext();
              const field = useField();
              const { getCollectionJoinField } = useCollectionManager();
              const { getField } = useCollection();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
              const { dn } = useDesignable();

              return {
                collectionName: collectionField?.target,
                defaultFilter: fieldSchema?.['x-component-props']?.params?.filter || {},
                form: form,
                onSubmit: ({ filter }) => {
                  _.set(field.componentProps, 'params', {
                    ...field.componentProps?.params,
                    filter,
                  });
                  fieldSchema['x-component-props']['params'] = field.componentProps.params;
                  dn.emit('patch', {
                    schema: {
                      ['x-uid']: fieldSchema['x-uid'],
                      'x-component-props': fieldSchema['x-component-props'],
                    },
                  });
                },
              };
            },
          },
          {
            name: 'setDefaultSortingRules',
            Component: SchemaSettingsDefaultSortingRules,
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const { getCollectionJoinField } = useCollectionManager();
              const { getField } = useCollection();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

              return {
                name: collectionField?.target,
              };
            },
          },
          {
            name: 'titleField',
            type: 'select',
            useComponentProps() {
              const fieldSchema = useFieldSchema();
              const { t } = useTranslation();
              const { getCollectionJoinField } = useCollectionManager();
              const { getField } = useCollection();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
              const { getCollectionFields } = useCollectionManager();
              const compile = useCompile();
              const { dn } = useDesignable();
              const targetFields = collectionField?.target ? getCollectionFields(collectionField?.target) : [];
              const options = targetFields
                .filter((field) => !field?.target && field.type !== 'boolean')
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

              return {
                key: 'title-field',
                title: t('Title field'),
                options: options,
                value: fieldSchema['x-component-props']?.fieldNames?.label,
                onChange: onTitleFieldChange,
              };
            },
          },
        ];
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      sort: 100,
      useComponentProps() {
        const { t } = useTranslation();

        return {
          removeParentsIfNoChildren: true,
          confirm: {
            title: t('Delete field'),
          },
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});
