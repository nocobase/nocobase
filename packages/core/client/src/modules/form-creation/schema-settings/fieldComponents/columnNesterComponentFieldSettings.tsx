import { useField } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import { useCollectionManager } from '../../../../collection-manager';
import { isFileCollection, useDesignable, useFieldModeOptions } from '../../../../schema-component';
import { useColumnSchema } from '../../../../schema-component/antd/table-v2/Table.Column.Decorator';
import { useLabelFields } from '../../../../schema-component/antd/table-v2/Table.Column.Designer';
import { SchemaSettingsSortingRule } from '../../../../schema-settings';

export const columnNesterComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:ColumnNester',
  items: [
    {
      name: 'fieldComponent',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const { getCollection } = useCollectionManager();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const targetCollection = getCollection(collectionField?.target);
        const isFileField = isFileCollection(targetCollection as any);
        const fieldModeOptions = useFieldModeOptions({ fieldSchema });
        const fieldMode = fieldSchema?.['x-component-props']?.['mode'] || 'Select';

        return {
          key: 'field-mode',
          title: t('Field component'),
          options: fieldSchema['x-read-pretty']
            ? [
                { label: t('Title'), value: 'Select' },
                isFileField && { label: t('File manager'), value: 'FileManager' },
                { label: t('Tag'), value: 'Tag' },
              ].filter(Boolean)
            : fieldModeOptions,
          value: fieldMode,
          onChange: (mode) => {
            const schema = {
              ['x-uid']: fieldSchema['x-uid'],
            };
            fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
            fieldSchema['x-component-props']['mode'] = mode;
            schema['x-component-props'] = fieldSchema['x-component-props'];
            field.componentProps = field.componentProps || {};
            field.componentProps.mode = mode;
            dn.emit('patch', {
              schema,
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'enableLink',
      type: 'switch',
      useVisible() {
        const { collectionField, fieldSchema } = useColumnSchema();
        return collectionField?.target && fieldSchema['x-read-pretty'];
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();

        return {
          title: t('Enable link'),
          checked: fieldSchema['x-component-props']?.enableLink !== false,
          onChange: (flag) => {
            fieldSchema['x-component-props'] = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            field.componentProps = {
              ...fieldSchema?.['x-component-props'],
              enableLink: flag,
            };
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema?.['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'titleField',
      type: 'select',
      useVisible() {
        const { collectionField } = useColumnSchema();
        return !!collectionField?.target;
      },
      useComponentProps() {
        const { uiSchema, fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const { t } = useTranslation();
        const { dn } = useDesignable();
        const fieldNames =
          fieldSchema?.['x-component-props']?.['fieldNames'] || uiSchema?.['x-component-props']?.['fieldNames'];
        const options = useLabelFields(collectionField?.target ?? collectionField?.targetCollection);

        return {
          title: t('Title field'),
          options: options,
          value: fieldNames?.['label'],
          onChange: (label) => {
            const fieldNames = {
              ...collectionField?.uiSchema?.['x-component-props']['fieldNames'],
              ...fieldSchema?.['x-component-props']?.['fieldNames'],
              label,
            };
            fieldSchema['x-component-props']['fieldNames'] = fieldNames;
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.fieldNames = fieldNames;
            });
            dn.emit('patch', {
              schema: {
                'x-uid': fieldSchema['x-uid'],
                'x-component-props': {
                  ...fieldSchema['x-component-props'],
                },
              },
            });
            dn.refresh();
          },
        };
      },
    },
    {
      name: 'setDefaultSortingRules',
      Component: SchemaSettingsSortingRule,
      useVisible() {
        const { fieldSchema, collectionField } = useColumnSchema();
        const field: any = useField();
        const isSubTableColumn = ['QuickEdit', 'FormItem'].includes(fieldSchema['x-decorator']);

        return (
          isSubTableColumn &&
          !field?.readPretty &&
          ['obo', 'oho', 'o2o', 'o2m', 'm2m', 'm2o'].includes(collectionField?.interface)
        );
      },
      useComponentProps() {
        const { fieldSchema } = useColumnSchema();
        const field: any = useField();

        return {
          fieldSchema,
          onSubmitCallBack: (sortArr) => {
            const path = field.path?.splice(field.path?.length - 1, 1);
            field.form.query(`${path.concat(`*.` + fieldSchema.name)}`).forEach((f) => {
              f.componentProps.service = f.componentProps.service || { params: {} };
              f.componentProps.service.params.sort = sortArr;
            });
          },
        };
      },
    },
  ],
});
