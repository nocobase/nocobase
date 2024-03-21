import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../schema-component';
import { SchemaSettingOptions } from '../application';
import { useSchemaToolbar } from '../application/schema-toolbar';
import { useCollection_deprecated, useCollectionManager_deprecated } from '../collection-manager';

export const generalSettingsItems: SchemaSettingOptions['items'] = [
  {
    name: 'editFieldTitle',
    type: 'modal',
    useComponentProps() {
      const { t } = useTranslation();
      const { dn } = useDesignable();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();
      const { getCollectionJoinField } = useCollectionManager_deprecated();
      const { getField } = useCollection_deprecated();
      const collectionField =
        getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

      return {
        title: t('Edit field title'),
        schema: {
          type: 'object',
          title: t('Edit field title'),
          properties: {
            title: {
              title: t('Field title'),
              default: field?.title,
              description: `${t('Original field title: ')}${collectionField?.uiSchema?.title}`,
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {},
            },
          },
        } as ISchema,
        onSubmit({ title }) {
          if (title) {
            field.title = title;
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
    useVisible() {
      const fieldSchema = useFieldSchema();
      const { getCollectionJoinField } = useCollectionManager_deprecated();
      const { getField } = useCollection_deprecated();
      const collectionField =
        getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);
      return !!collectionField;
    },
  },
  {
    name: 'displayTitle',
    type: 'switch',
    useComponentProps() {
      const { t } = useTranslation();
      const { dn } = useDesignable();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();

      return {
        title: t('Display title'),
        checked: fieldSchema['x-decorator-props']?.['showTitle'] ?? true,
        onChange(checked) {
          fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
          fieldSchema['x-decorator-props']['showTitle'] = checked;
          field.decoratorProps.showTitle = checked;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-decorator-props': {
                ...fieldSchema['x-decorator-props'],
                showTitle: checked,
              },
            },
          });
          dn.refresh();
        },
      };
    },
  },
  {
    name: 'editDescription',
    type: 'modal',
    useComponentProps() {
      const { t } = useTranslation();
      const { dn } = useDesignable();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();

      return {
        title: t('Edit description'),
        schema: {
          type: 'object',
          title: t('Edit description'),
          properties: {
            description: {
              // title: t('Description'),
              default: field?.description,
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              'x-component-props': {},
            },
          },
        } as ISchema,
        onSubmit({ description }) {
          field.description = description;
          fieldSchema.description = description;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              description: fieldSchema.description,
            },
          });
          dn.refresh();
        },
      };
    },
    useVisible() {
      const field = useField<Field>();
      return !field.readPretty;
    },
  },
  {
    name: 'editTooltip',
    type: 'modal',
    useComponentProps() {
      const { t } = useTranslation();
      const { dn } = useDesignable();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();

      return {
        title: t('Edit tooltip'),
        schema: {
          type: 'object',
          title: t('Edit tooltip'),
          properties: {
            tooltip: {
              default: fieldSchema?.['x-decorator-props']?.tooltip,
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              'x-component-props': {},
            },
          },
        } as ISchema,
        onSubmit({ tooltip }) {
          field.decoratorProps.tooltip = tooltip;
          fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
          fieldSchema['x-decorator-props']['tooltip'] = tooltip;
          dn.emit('patch', {
            schema: {
              'x-uid': fieldSchema['x-uid'],
              'x-decorator-props': fieldSchema['x-decorator-props'],
            },
          });
          dn.refresh();
        },
      };
    },
    useVisible() {
      const field = useField<Field>();
      return field.readPretty;
    },
  },
  {
    name: 'required',
    type: 'switch',
    useComponentProps() {
      const { t } = useTranslation();
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();
      const { dn, refresh } = useDesignable();

      return {
        title: t('Required'),
        checked: fieldSchema.required as boolean,
        onChange(required) {
          const schema = {
            ['x-uid']: fieldSchema['x-uid'],
          };
          field.required = required;
          fieldSchema['required'] = required;
          schema['required'] = required;
          dn.emit('patch', {
            schema,
          });
          refresh();
        },
      };
    },
    useVisible() {
      const field = useField<Field>();
      const fieldSchema = useFieldSchema();
      const { required = true } = useSchemaToolbar();
      return !field.readPretty && fieldSchema['x-component'] !== 'FormField' && required;
    },
  },
];
