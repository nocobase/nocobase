import { useCollection } from '@nocobase/client';
import { generateNTemplate } from '../../../locale';

// 表单的操作配置
export const CalendarFormActionInitializers = {
  title: generateNTemplate('Configure actions'),
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'itemGroup',
      title: generateNTemplate('Enable actions'),
      children: [
        {
          type: 'item',
          title: generateNTemplate('Edit'),
          component: 'UpdateActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
            'x-component-props': {
              type: 'primary',
            },
          },
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Delete'),
          component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
          },
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Delete Event'),
          component: 'DeleteEventActionInitializer',
          schema: {
            'x-component': 'Action',
            'x-decorator': 'ACLActionProvider',
          },
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Print'),
          component: 'PrintActionInitializer',
          schema: {
            'x-component': 'Action',
          },
        },
      ],
    },

    {
      type: 'divider',
    },
    {
      type: 'subMenu',
      title: generateNTemplate('Customize'),
      children: [
        {
          type: 'item',
          title: generateNTemplate('Popup'),
          component: 'CustomizeActionInitializer',
          schema: {
            type: 'void',
            title: generateNTemplate('Popup'),
            'x-action': 'customize:popup',
            'x-designer': 'Action.Designer',
            'x-component': 'Action',
            'x-component-props': {
              openMode: 'drawer',
            },
            properties: {
              drawer: {
                type: 'void',
                title: generateNTemplate('Popup'),
                'x-component': 'Action.Container',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: generateNTemplate('Details'),
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'RecordBlockInitializers',
                            properties: {},
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Update record'),
          component: 'CustomizeActionInitializer',
          schema: {
            title: generateNTemplate('Update record'),
            'x-component': 'Action',
            'x-designer': 'Action.Designer',
            'x-acl-action': 'update',
            'x-action': 'customize:update',
            'x-action-settings': {
              assignedValues: {},
              onSuccess: {
                manualClose: true,
                redirecting: false,
                successMessage: generateNTemplate('Updated successfully'),
              },
            },
            'x-component-props': {
              useProps: '{{ useCustomizeUpdateActionProps }}',
            },
          },
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: generateNTemplate('Custom request'),
          component: 'CustomRequestInitializer',
          visible: function useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
      ],
    },
  ],
};
