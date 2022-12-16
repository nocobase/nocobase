import { useForm } from '@formily/react';
import React from 'react';
import { SchemaComponent, useActionContext, useDesignable, useRecordIndex } from '../..';

export const getMenuTabSchema = (title, icon = '') => {
  return {
    type: 'void',
    title,
    'x-component': 'Tabs.TabPane',
    'x-designer': 'Tabs.Designer',
    'x-component-props': {
      icon,
    },
    properties: {
      div: {
        type: 'void',
        'x-component': 'div',
        'x-component-props': {
          style: {
            marginLeft: 24,
            marginRight: 24,
          },
        },
        properties: {
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'BlockInitializers',
            properties: {},
          },
        },
      },
    },
  };
};
export const TabPaneInitializers = (props?: any) => {
  const { designable, insertBeforeEnd } = useDesignable();
  if (!designable) {
    return null;
  }
  const useSubmitAction = () => {
    const form = useForm();
    const ctx = useActionContext();
    const index = useRecordIndex();
    let initializer = 'RecordBlockInitializers';
    if (props.isCreate || index === null) {
      initializer = 'CreateFormBlockInitializers';
    } else if (props.isBulkEdit) {
      initializer = 'CreateFormBulkEditBlockInitializers';
    }

    return {
      async run() {
        await form.submit();
        const { title, icon } = form.values;
        if (props.isMenu) {
          insertBeforeEnd(getMenuTabSchema(title, icon));
        } else {
          insertBeforeEnd({
            type: 'void',
            title,
            'x-component': 'Tabs.TabPane',
            'x-designer': 'Tabs.Designer',
            'x-component-props': {
              icon,
            },
            properties: {
              grid: {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': initializer,
                properties: {},
              },
            },
          });
        }

        await form.reset();
        ctx.setVisible(false);
      },
    };
  };
  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          action1: {
            type: 'void',
            'x-component': 'Action',
            'x-component-props': {
              icon: 'PlusOutlined',
              style: {
                borderColor: 'rgb(241, 139, 98)',
                color: 'rgb(241, 139, 98)',
              },
              type: 'dashed',
            },
            title: '{{t("Add tab")}}',
            properties: {
              drawer1: {
                'x-decorator': 'Form',
                'x-component': 'Action.Modal',
                'x-component-props': {
                  width: 520,
                },
                type: 'void',
                title: '{{t("Add tab")}}',
                properties: {
                  title: {
                    title: '{{t("Tab name")}}',
                    required: true,
                    'x-component': 'Input',
                    'x-decorator': 'FormItem',
                  },
                  icon: {
                    title: '{{t("Icon")}}',
                    'x-component': 'IconPicker',
                    'x-decorator': 'FormItem',
                  },
                  footer: {
                    'x-component': 'Action.Modal.Footer',
                    type: 'void',
                    properties: {
                      cancel: {
                        title: '{{t("Cancel")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: () => {
                            const ctx = useActionContext();
                            return {
                              async run() {
                                ctx.setVisible(false);
                              },
                            };
                          },
                        },
                      },
                      submit: {
                        title: '{{t("Submit")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          useAction: useSubmitAction,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }}
    />
  );
};

export const TabPaneInitializersForCreateFormBlock = (props) => {
  return <TabPaneInitializers {...props} isCreate />;
};

export const TabPaneInitializersForBulkEditFormBlock = (props) => {
  return <TabPaneInitializers {...props} isBulkEdit />;
};

export const TabPaneInitializersForMenuBlock = (props) => {
  return <TabPaneInitializers {...props} isMenu />;
};
