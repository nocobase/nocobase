import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { formTriggerWorkflowActionInitializerV2 } from './formActionInitializers';

/**
 * @deprecated
 */
export const createFormActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'CreateFormActionInitializers',
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      type: 'itemGroup',
      title: '{{t("Enable actions")}}',
      name: 'enableActions',
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
      type: 'subMenu',
      title: '{{t("Customize")}}',
      name: 'customize',
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

export const createFormActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'actionInitializers:createForm',
    title: '{{t("Configure actions")}}',
    icon: 'SettingOutlined',
    items: [
      {
        type: 'itemGroup',
        title: '{{t("Enable actions")}}',
        name: 'enableActions',
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
        type: 'subMenu',
        title: '{{t("Customize")}}',
        name: 'customize',
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
  createFormActionInitializers_deprecated,
);
