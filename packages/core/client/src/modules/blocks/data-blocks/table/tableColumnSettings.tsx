import { ISchema } from '@formily/json-schema';
import { useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../../application';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useCollectionManager_deprecated } from '../../../../collection-manager';
import { useDesignable } from '../../../../schema-component';
import { useAssociationFieldContext } from '../../../../schema-component/antd/association-field/hooks';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { SchemaSettingsDefaultValue, isPatternDisabled } from '../../../../schema-settings';
import { useFieldComponentName } from './utils';

export const tableColumnSettings = new SchemaSettings({
  name: 'fieldSettings:TableColumn',
  items: [
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      hideIfNoChildren: true,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('Generic properties'),
        };
      },
      children: [
        {
          name: 'customColumnTitle',
          type: 'modal',
          useComponentProps() {
            const { fieldSchema, collectionField } = useColumnSchema();
            const field: any = useField();
            const { t } = useTranslation();
            const columnSchema = useFieldSchema();
            const { dn } = useDesignable();

            return {
              title: t('Custom column title'),
              schema: {
                type: 'object',
                title: t('Custom column title'),
                properties: {
                  title: {
                    title: t('Column title'),
                    default: columnSchema?.title,
                    description: `${t('Original field title: ')}${
                      collectionField?.uiSchema?.title || fieldSchema?.title
                    }`,
                    'x-decorator': 'FormItem',
                    'x-component': 'Input',
                    'x-component-props': {},
                  },
                },
              } as ISchema,
              onSubmit: ({ title }) => {
                if (title) {
                  field.title = title;
                  columnSchema.title = title;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': columnSchema['x-uid'],
                      title: columnSchema.title,
                    },
                  });
                }
                dn.refresh();
              },
            };
          },
        },
        {
          name: 'columnWidth',
          type: 'modal',
          useComponentProps() {
            const field: any = useField();
            const { t } = useTranslation();
            const columnSchema = useFieldSchema();
            const { dn } = useDesignable();

            return {
              title: t('Column width'),
              schema: {
                type: 'object',
                title: t('Column width'),
                properties: {
                  width: {
                    default: columnSchema?.['x-component-props']?.['width'] || 200,
                    'x-decorator': 'FormItem',
                    'x-component': 'InputNumber',
                    'x-component-props': {},
                  },
                },
              } as ISchema,
              onSubmit: ({ width }) => {
                const props = columnSchema['x-component-props'] || {};
                props['width'] = width;
                const schema: ISchema = {
                  ['x-uid']: columnSchema['x-uid'],
                };
                schema['x-component-props'] = props;
                columnSchema['x-component-props'] = props;
                field.componentProps.width = width;
                dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              },
            };
          },
        },
        {
          name: 'sortable',
          type: 'switch',
          useVisible() {
            const { collectionField } = useColumnSchema();
            const { getInterface } = useCollectionManager_deprecated();
            const interfaceCfg = getInterface(collectionField?.interface);
            const { currentMode } = useAssociationFieldContext();

            return interfaceCfg?.sortable === true && !currentMode;
          },
          useComponentProps() {
            const field: any = useField();
            const { t } = useTranslation();
            const columnSchema = useFieldSchema();
            const { dn } = useDesignable();

            return {
              title: t('Sortable'),
              checked: field.componentProps.sorter,
              onChange: (v) => {
                const schema: ISchema = {
                  ['x-uid']: columnSchema['x-uid'],
                };
                columnSchema['x-component-props'] = {
                  ...columnSchema['x-component-props'],
                  sorter: v,
                };
                schema['x-component-props'] = columnSchema['x-component-props'];
                field.componentProps.sorter = v;
                dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              },
            };
          },
        },
        {
          name: 'setDefaultValue',
          useVisible() {
            const { fieldSchema } = useColumnSchema();
            return !fieldSchema['x-read-pretty'];
          },
          Component: SchemaSettingsDefaultValue as any,
          useComponentProps() {
            const { fieldSchema } = useColumnSchema();
            return {
              fieldSchema,
            };
          },
        },
        {
          name: 'required',
          type: 'switch',
          useVisible() {
            const { uiSchema, fieldSchema } = useColumnSchema();
            const field: any = useField();
            const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
            return isSubTableColumn && !field.readPretty && !uiSchema?.['x-read-pretty'];
          },
          useComponentProps() {
            const { fieldSchema } = useColumnSchema();
            const field: any = useField();
            const { t } = useTranslation();
            const { dn } = useDesignable();

            return {
              key: 'required',
              title: t('Required'),
              checked: fieldSchema.required as boolean,
              onChange: (required) => {
                const schema = {
                  ['x-uid']: fieldSchema['x-uid'],
                };
                fieldSchema['required'] = required;
                schema['required'] = required;
                const path = field.path?.splice(field.path?.length - 1, 1);
                field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                  f.required = required;
                });
                dn.emit('patch', {
                  schema,
                });
                dn.refresh();
              },
            };
          },
        },
        {
          name: 'pattern',
          type: 'select',
          useVisible() {
            const { fieldSchema, collectionField } = useColumnSchema();
            const field: any = useField();
            const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);
            return (
              isSubTableColumn &&
              !field?.readPretty &&
              collectionField?.interface !== 'o2m' &&
              !isPatternDisabled(fieldSchema)
            );
          },
          useComponentProps() {
            const { fieldSchema } = useColumnSchema();
            const field: any = useField();
            const { t } = useTranslation();
            const { dn } = useDesignable();
            let readOnlyMode = 'editable';
            if (fieldSchema['x-disabled'] === true) {
              readOnlyMode = 'readonly';
            }
            if (fieldSchema['x-read-pretty'] === true) {
              readOnlyMode = 'read-pretty';
            }

            return {
              key: 'pattern',
              title: t('Pattern'),
              options: [
                { label: t('Editable'), value: 'editable' },
                { label: t('Readonly'), value: 'readonly' },
                { label: t('Easy-reading'), value: 'read-pretty' },
              ],
              value: readOnlyMode,
              onChange: (v) => {
                const schema: ISchema = {
                  ['x-uid']: fieldSchema['x-uid'],
                };
                const path = field.path?.splice(field.path?.length - 1, 1);
                switch (v) {
                  case 'readonly': {
                    fieldSchema['x-read-pretty'] = false;
                    fieldSchema['x-disabled'] = true;
                    schema['x-read-pretty'] = false;
                    schema['x-disabled'] = true;
                    field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                      f.readonly = true;
                      f.disabled = true;
                    });
                    break;
                  }
                  case 'read-pretty': {
                    fieldSchema['x-read-pretty'] = true;
                    fieldSchema['x-disabled'] = false;
                    schema['x-read-pretty'] = true;
                    schema['x-disabled'] = false;
                    field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                      f.readPretty = true;
                    });
                    break;
                  }
                  default: {
                    fieldSchema['x-read-pretty'] = false;
                    fieldSchema['x-disabled'] = false;
                    schema['x-read-pretty'] = false;
                    schema['x-disabled'] = false;
                    field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
                      f.readPretty = false;
                      f.disabled + false;
                    });
                    break;
                  }
                }

                dn.emit('patch', {
                  schema,
                });

                dn.refresh();
              },
            };
          },
        },
      ],
    },
    {
      name: 'componentOptions',
      type: 'itemGroup',
      hideIfNoChildren: true,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('Specific properties'),
        };
      },
      useChildren() {
        const app = useApp();
        const fieldComponentName = useFieldComponentName();
        const map = {
          Select: 'Select',
          DatePicker: 'DatePicker',
          Nester: 'Nester',
          SubTable: 'SubTable',
          Picker: 'Picker',
          PopoverNester: 'PopoverNester',
          Tag: 'Tag',
        };
        const componentSettings = app.schemaSettingsManager.get(
          `fieldSettings:component:${map[fieldComponentName] || fieldComponentName}`,
        );
        return componentSettings?.items || [];
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
