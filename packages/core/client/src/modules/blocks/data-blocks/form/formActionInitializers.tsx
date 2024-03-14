import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';

/**
 * @deprecated
 * 表单的操作配置
 */
export const formActionInitializers = new SchemaInitializer({
  name: 'FormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      name: 'enableActions',
      title: '{{t("Enable actions")}}',
      children: [
        {
          name: 'submit',
          title: '{{t("Submit")}}',
          Component: 'CreateSubmitActionInitializer',
          schema: {
            'x-action-settings': {},
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'customize',
      type: 'subMenu',
      title: '{{t("Customize")}}',
      children: [
        {
          name: 'saveRecord',
          title: '{{t("Save record")}}',
          Component: 'SaveRecordActionInitializer',
        },
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});
