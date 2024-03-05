import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializerItemType } from '../../../../application/schema-initializer/types';

export const formTriggerWorkflowActionInitializerV2: SchemaInitializerItemType = {
  name: 'submitToWorkflow',
  title: '{{t("Submit to workflow", { ns: "workflow" })}}',
  Component: 'FormTriggerWorkflowActionInitializerV2',
};

/**
 * @deprecated
 * 表单的操作配置
 */
export const formActionInitializers_deprecated = new CompatibleSchemaInitializer({
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
      name: 'custom',
      type: 'subMenu',
      title: '{{t("Customize")}}',
      children: [
        {
          name: 'saveRecord',
          title: '{{t("Save record")}}',
          Component: 'SaveRecordActionInitializer',
        },
        formTriggerWorkflowActionInitializerV2,
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});

export const formActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'actionInitializers:form',
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
        name: 'custom',
        type: 'subMenu',
        title: '{{t("Customize")}}',
        children: [
          {
            name: 'saveRecord',
            title: '{{t("Save record")}}',
            Component: 'SaveRecordActionInitializer',
          },
          formTriggerWorkflowActionInitializerV2,
          {
            name: 'customRequest',
            title: '{{t("Custom request")}}',
            Component: 'CustomRequestInitializer',
          },
        ],
      },
    ],
  },
  formActionInitializers_deprecated,
);
