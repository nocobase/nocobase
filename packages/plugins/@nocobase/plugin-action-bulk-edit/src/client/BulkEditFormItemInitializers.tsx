import { SchemaInitializer, gridRowColWrap } from '@nocobase/client';
import { useCustomBulkEditFormItemInitializerFields } from './utils';

/**
 * @deprecated
 */
export const BulkEditFormItemInitializers_deprecated: SchemaInitializer = new SchemaInitializer({
  name: 'BulkEditFormItemInitializers',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      name: 'displayFields',
      type: 'itemGroup',
      title: '{{t("Display fields")}}',
      useChildren: useCustomBulkEditFormItemInitializerFields,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'addText',
      title: '{{t("Add text")}}',
      Component: 'BlockItemInitializer',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        // 'x-designer': 'Markdown.Void.Designer',
        'x-toolbar': 'BlockSchemaToolbar',
        'x-settings': 'blockSettings:markdown',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
        },
      },
    },
  ],
});

export const bulkEditFormItemInitializers: SchemaInitializer = new SchemaInitializer({
  name: 'fieldInitializers:bulkEditFormItem',
  wrap: gridRowColWrap,
  icon: 'SettingOutlined',
  title: '{{t("Configure fields")}}',
  items: [
    {
      name: 'displayFields',
      type: 'itemGroup',
      title: '{{t("Display fields")}}',
      useChildren: useCustomBulkEditFormItemInitializerFields,
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'addText',
      title: '{{t("Add text")}}',
      Component: 'BlockItemInitializer',
      schema: {
        type: 'void',
        'x-editable': false,
        'x-decorator': 'FormItem',
        // 'x-designer': 'Markdown.Void.Designer',
        'x-toolbar': 'BlockSchemaToolbar',
        'x-settings': 'blockSettings:markdown',
        'x-component': 'Markdown.Void',
        'x-component-props': {
          content: '{{t("This is a demo text, **supports Markdown syntax**.")}}',
        },
      },
    },
  ],
});
