import { SchemaInitializer } from '../../../../application/schema-initializer/SchemaInitializer';
import { formTriggerWorkflowActionInitializerV2 } from './formActionInitializers';

/**
 * @deprecated
 */
export const updateFormActionInitializers_deprecated = new SchemaInitializer({
  name: 'UpdateFormActionInitializers',
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
          Component: 'UpdateSubmitActionInitializer',
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
          name: 'popup',
          title: '{{t("Popup")}}',
          Component: 'PopupActionInitializer',
          useComponentProps() {
            return {
              'x-component': 'Action',
            };
          },
        },
        {
          name: 'saveRecord',
          title: '{{t("Save record")}}',
          Component: 'SaveRecordActionInitializer',
        },
        formTriggerWorkflowActionInitializerV2,
        {
          type: 'item',
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});

export const updateFormActionInitializers = new SchemaInitializer({
  name: 'actionInitializers:updateForm',
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
          Component: 'UpdateSubmitActionInitializer',
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
          name: 'popup',
          title: '{{t("Popup")}}',
          Component: 'PopupActionInitializer',
          useComponentProps() {
            return {
              'x-component': 'Action',
            };
          },
        },
        {
          name: 'saveRecord',
          title: '{{t("Save record")}}',
          Component: 'SaveRecordActionInitializer',
        },
        formTriggerWorkflowActionInitializerV2,
        {
          type: 'item',
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
        },
      ],
    },
  ],
});
