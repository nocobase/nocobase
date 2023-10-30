import { useForm } from '@formily/react';
import React, { useMemo } from 'react';
import { SchemaComponent, useActionContext, useDesignable, useRecordIndex } from '../..';
import { SchemaInitializer } from '../../application';
import { useGetAriaLabelOfSchemaInitializer } from '../hooks/useGetAriaLabelOfSchemaInitializer';

export const TabPaneInitializers = (props?: any) => {
  const { designable, insertBeforeEnd } = useDesignable();
  const { isCreate, isBulkEdit, options } = props;
  const { gridInitializer } = options;
  const { getAriaLabel } = useGetAriaLabelOfSchemaInitializer();

  const useSubmitAction = () => {
    const form = useForm();
    const ctx = useActionContext();
    const index = useRecordIndex();
    let initializer = gridInitializer;
    if (!initializer) {
      initializer = 'RecordBlockInitializers';
      if (isCreate || index === null) {
        initializer = 'CreateFormBlockInitializers';
      } else if (isBulkEdit) {
        initializer = 'CreateFormBulkEditBlockInitializers';
      }
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
              'x-initializer': initializer,
              properties: {},
            },
          },
        });
        await form.reset();
        ctx.setVisible(false);
      },
    };
  };
  const schema = useMemo(() => {
    return {
      type: 'void',
      properties: {
        action1: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            icon: 'PlusOutlined',
            style: {
              borderColor: 'var(--colorSettings)',
              color: 'var(--colorSettings)',
            },
            type: 'dashed',
            'aria-label': getAriaLabel(),
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
    };
  }, []);

  if (!designable) {
    return null;
  }

  return <SchemaComponent schema={schema} />;
};

export const TabPaneInitializersForCreateFormBlock = (props) => {
  return <TabPaneInitializers {...props} isCreate />;
};

export const TabPaneInitializersForBulkEditFormBlock = (props) => {
  return <TabPaneInitializers {...props} isBulkEdit />;
};

export const tabPaneInitializers = new SchemaInitializer({
  name: 'TabPaneInitializers',
  Component: TabPaneInitializers,
  noPopover: true,
});

export const tabPaneInitializersForRecordBlock = new SchemaInitializer({
  name: 'TabPaneInitializersForCreateFormBlock',
  Component: TabPaneInitializersForCreateFormBlock,
  noPopover: true,
});

export const tabPaneInitializersForBulkEditFormBlock = new SchemaInitializer({
  name: 'TabPaneInitializersForBulkEditFormBlock',
  Component: TabPaneInitializersForBulkEditFormBlock,
  noPopover: true,
});
