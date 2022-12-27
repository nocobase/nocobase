import { useFieldSchema, useForm } from '@formily/react';
import React, {useState} from 'react';
import { SchemaComponent, useActionContext, useDesignable, useRecordIndex} from '../..';
import { Switch } from 'antd';
import {usePageMode} from "../../block-provider/hooks";
import { getActionContainerLevel } from '../../schema-component/antd/action/utils';


export const TabPaneInitializers = (props?: any) => {
  const fieldSchema = useFieldSchema();
  const { isPageMode } = usePageMode();
  const { designable, insertBeforeEnd, dn } = useDesignable();
  const [share,setShare] = useState(fieldSchema['x-component-props']?.share)
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
              'x-initializer':
                props.isCreate || index === null ? 'CreateFormBlockInitializers' : 'RecordBlockInitializers',
              properties: {},
            },
          },
        });
        await form.reset();
        ctx.setVisible(false);
      },
    };
  };
  const level = getActionContainerLevel(fieldSchema)
  if ((isPageMode && level > 0) || level > 1) {
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
  }
  return (
    <SchemaComponent
      components={{ Switch }}
      schema={{
        type: 'void',
        properties: {
          space: {
            type: 'void',
            'x-component': 'Space',
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
              action2: {
                type: 'boolean',
                'x-component': 'Switch',
                'x-component-props': {
                  defaultChecked: share,
                  checkedChildren: '{{t("Share")}}',
                  unCheckedChildren: '{{t("Share")}}',
                  onChange: (v) => {
                    setShare(v)
                    fieldSchema['x-component-props'].share = v
                    dn.emit('patch', {
                      schema: {
                        'x-uid': fieldSchema['x-uid'],
                        'x-component-props': {
                          share: v
                        },
                      },
                    });
                    dn.refresh();
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
