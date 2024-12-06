/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  Nester: {
    type: 'void',
    'x-component': 'AssociationField.Nester',
    properties: {
      grid: {
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'form:configureFields',
      },
    },
  },
  AddNewer: {
    type: 'void',
    'x-component': 'AssociationField.AddNewer',
    'x-action': 'create',
    title: '{{ t("Add record") }}',
    'x-component-props': {
      className: 'nb-action-popup',
    },
    properties: {
      tabs: {
        type: 'void',
        'x-component': 'Tabs',
        'x-component-props': {},
        'x-initializer': 'popup:addTab',
        'x-initializer-props': {
          gridInitializer: 'popup:addNew:addBlock',
        },
        properties: {
          tab1: {
            type: 'void',
            title: '{{t("Add new")}}',
            'x-component': 'Tabs.TabPane',
            'x-designer': 'Tabs.Designer',
            'x-component-props': {},
            properties: {
              grid: {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': 'popup:addNew:addBlock',
                properties: {},
              },
            },
          },
        },
      },
    },
  },
  Selector: {
    type: 'void',
    'x-component': 'AssociationField.Selector',
    title: '{{ t("Select record") }}',
    'x-component-props': {
      className: 'nb-record-picker-selector',
    },
    properties: {
      grid: {
        type: 'void',
        'x-component': 'Grid',
        'x-initializer': 'popup:tableSelector:addBlock',
        properties: {},
      },
      footer: {
        'x-component': 'Action.Container.Footer',
        'x-component-props': {},
        properties: {
          actions: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {},
            properties: {
              submit: {
                title: '{{ t("Submit") }}',
                'x-action': 'submit',
                'x-component': 'Action',
                'x-use-component-props': 'usePickActionProps',
                // 'x-designer': 'Action.Designer',
                'x-toolbar': 'ActionSchemaToolbar',
                'x-settings': 'actionSettings:submit',
                'x-component-props': {
                  type: 'primary',
                  htmlType: 'submit',
                },
              },
            },
          },
        },
      },
    },
  },
  Viewer: {
    type: 'void',
    title: '{{ t("View record") }}',
    'x-component': 'AssociationField.Viewer',
    'x-component-props': {
      className: 'nb-action-popup',
    },
    properties: {
      tabs: {
        type: 'void',
        'x-component': 'Tabs',
        'x-component-props': {},
        'x-initializer': 'popup:addTab',
        properties: {
          tab1: {
            type: 'void',
            title: '{{t("Details")}}',
            'x-component': 'Tabs.TabPane',
            'x-designer': 'Tabs.Designer',
            'x-component-props': {},
            properties: {
              grid: {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': 'popup:common:addBlock',
                properties: {},
              },
            },
          },
        },
      },
    },
  },
  SubTable: {
    type: 'void',
    'x-component': 'AssociationField.SubTable',
    'x-initializer': 'table:configureColumns',
    'x-initializer-props': {
      action: false,
    },
    properties: {},
  },
  AddNewAction: {
    type: 'void',
    'x-component': 'AssociationField.SubTable.AddNewAction',
    properties: {
      'add-new': {
        type: 'void',
        title: '{{ t("Add new") }}',
        'x-component': 'Action',
        'x-designer': 'Action.Designer',
        'x-action': '',
        'x-designer-props': {
          enableDrag: false,
        },
        'x-action-settings': {
          removable: false,
          disableSecondConFirm: true,
        },
        'x-component-props': {
          type: 'default',
          onClick: '{{handleAddNew}}',
          size: 'small',
        },
      },
    },
  },
  SelectAction: {
    type: 'void',
    'x-component': 'AssociationField.SubTable.SelectAction',
    properties: {
      select: {
        type: 'void',
        title: '{{ t("Select") }}',
        'x-component': 'Action',
        'x-action': '',
        'x-designer': 'Action.Designer',
        'x-designer-props': {
          enableDrag: false,
        },
        'x-action-settings': {
          removable: false,
          disableSecondConFirm: true,
        },
        'x-component-props': {
          type: 'default',
          onClick: '{{handleSelect}}',
          size: 'small',
        },
      },
    },
  },
};
