/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const shouldDisplayImageNormally = {
  collections: [
    {
      name: 'image',
      fields: [
        {
          name: 'attachment',
          interface: 'attachment',
        },
      ],
    },
  ],
  pageSchema: {
    type: 'void',
    'x-component': 'Grid',
    'x-component-props': {
      showDivider: false,
    },
    'x-initializer': 'mobile:addBlock',
    properties: {
      '2qkpsi1o454': {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-component': 'Grid.Row',
        'x-app-version': '1.3.42-beta',
        properties: {
          n7plq4w7u4j: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Grid.Col',
            'x-app-version': '1.3.42-beta',
            properties: {
              vi2vd17p09w: {
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-decorator': 'TableBlockProvider',
                'x-acl-action': 'image:list',
                'x-use-decorator-props': 'useTableBlockDecoratorProps',
                'x-decorator-props': {
                  collection: 'image',
                  dataSource: 'main',
                  action: 'list',
                  params: {
                    pageSize: 20,
                  },
                  rowKey: 'id',
                  showIndex: true,
                  dragSort: false,
                },
                'x-toolbar': 'BlockSchemaToolbar',
                'x-settings': 'blockSettings:table',
                'x-component': 'CardItem',
                'x-filter-targets': [],
                'x-app-version': '1.3.42-beta',
                properties: {
                  actions: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-initializer': 'table:configureActions',
                    'x-component': 'ActionBar',
                    'x-component-props': {
                      style: {
                        marginBottom: 'var(--nb-spacing)',
                      },
                    },
                    'x-app-version': '1.3.42-beta',
                    'x-uid': 'xdkvvipejgd',
                    'x-async': false,
                    'x-index': 1,
                  },
                  '61g0b1ddb4a': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'array',
                    'x-initializer': 'table:configureColumns',
                    'x-component': 'TableV2',
                    'x-use-component-props': 'useTableBlockProps',
                    'x-component-props': {
                      rowKey: 'id',
                      rowSelection: {
                        type: 'checkbox',
                      },
                    },
                    'x-app-version': '1.3.42-beta',
                    properties: {
                      actions: {
                        'x-uid': 'rjpymlq1jzw',
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        title: '{{ t("Actions") }}',
                        'x-action-column': 'actions',
                        'x-decorator': 'TableV2.Column.ActionBar',
                        'x-component': 'TableV2.Column',
                        'x-toolbar': 'TableColumnSchemaToolbar',
                        'x-initializer': 'table:configureItemActions',
                        'x-settings': 'fieldSettings:TableColumn',
                        'x-toolbar-props': {
                          initializer: 'table:configureItemActions',
                        },
                        'x-app-version': '1.3.42-beta',
                        'x-component-props': {
                          width: 50,
                        },
                        properties: {
                          nj2c3kinca5: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'void',
                            'x-decorator': 'DndContext',
                            'x-component': 'Space',
                            'x-component-props': {
                              split: '|',
                            },
                            'x-app-version': '1.3.42-beta',
                            properties: {
                              dzdmqaizn2s: {
                                _isJSONSchemaObject: true,
                                version: '2.0',
                                type: 'void',
                                title: '{{ t("View") }}',
                                'x-action': 'view',
                                'x-toolbar': 'ActionSchemaToolbar',
                                'x-settings': 'actionSettings:view',
                                'x-component': 'Action.Link',
                                'x-component-props': {
                                  openMode: 'page',
                                },
                                'x-action-context': {
                                  dataSource: 'main',
                                  collection: 'image',
                                },
                                'x-decorator': 'ACLActionProvider',
                                'x-designer-props': {
                                  linkageAction: true,
                                },
                                properties: {
                                  drawer: {
                                    _isJSONSchemaObject: true,
                                    version: '2.0',
                                    type: 'void',
                                    title: '{{ t("View record") }}',
                                    'x-component': 'Action.Container',
                                    'x-component-props': {
                                      className: 'nb-action-popup',
                                    },
                                    properties: {
                                      tabs: {
                                        _isJSONSchemaObject: true,
                                        version: '2.0',
                                        type: 'void',
                                        'x-component': 'Tabs',
                                        'x-component-props': {},
                                        'x-initializer': 'popup:addTab',
                                        properties: {
                                          tab1: {
                                            _isJSONSchemaObject: true,
                                            version: '2.0',
                                            type: 'void',
                                            title: '{{t("Details")}}',
                                            'x-component': 'Tabs.TabPane',
                                            'x-designer': 'Tabs.Designer',
                                            'x-component-props': {},
                                            properties: {
                                              grid: {
                                                _isJSONSchemaObject: true,
                                                version: '2.0',
                                                type: 'void',
                                                'x-component': 'Grid',
                                                'x-initializer': 'popup:common:addBlock',
                                                properties: {
                                                  v3lu0q5qb2s: {
                                                    _isJSONSchemaObject: true,
                                                    version: '2.0',
                                                    type: 'void',
                                                    'x-component': 'Grid.Row',
                                                    'x-app-version': '1.3.42-beta',
                                                    properties: {
                                                      '8v6rb76xzcl': {
                                                        _isJSONSchemaObject: true,
                                                        version: '2.0',
                                                        type: 'void',
                                                        'x-component': 'Grid.Col',
                                                        'x-app-version': '1.3.42-beta',
                                                        properties: {
                                                          j5mq2jtfqbu: {
                                                            _isJSONSchemaObject: true,
                                                            version: '2.0',
                                                            type: 'void',
                                                            'x-acl-action': 'image:get',
                                                            'x-decorator': 'DetailsBlockProvider',
                                                            'x-use-decorator-props': 'useDetailsDecoratorProps',
                                                            'x-decorator-props': {
                                                              dataSource: 'main',
                                                              collection: 'image',
                                                              readPretty: true,
                                                              action: 'get',
                                                            },
                                                            'x-toolbar': 'BlockSchemaToolbar',
                                                            'x-settings': 'blockSettings:details',
                                                            'x-component': 'CardItem',
                                                            'x-app-version': '1.3.42-beta',
                                                            properties: {
                                                              l2d5m4sojzb: {
                                                                _isJSONSchemaObject: true,
                                                                version: '2.0',
                                                                type: 'void',
                                                                'x-component': 'Details',
                                                                'x-read-pretty': true,
                                                                'x-use-component-props': 'useDetailsProps',
                                                                'x-app-version': '1.3.42-beta',
                                                                properties: {
                                                                  ilctz1mj532: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-initializer': 'details:configureActions',
                                                                    'x-component': 'ActionBar',
                                                                    'x-component-props': {
                                                                      style: {
                                                                        marginBottom: 24,
                                                                      },
                                                                    },
                                                                    'x-app-version': '1.3.42-beta',
                                                                    properties: {
                                                                      lhm4dx0xm3r: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        title: '{{ t("Edit") }}',
                                                                        'x-action': 'update',
                                                                        'x-toolbar': 'ActionSchemaToolbar',
                                                                        'x-settings': 'actionSettings:edit',
                                                                        'x-component': 'Action',
                                                                        'x-component-props': {
                                                                          openMode: 'page',
                                                                          icon: 'EditOutlined',
                                                                          type: 'primary',
                                                                        },
                                                                        'x-action-context': {
                                                                          dataSource: 'main',
                                                                          collection: 'image',
                                                                        },
                                                                        'x-decorator': 'ACLActionProvider',
                                                                        'x-app-version': '1.3.42-beta',
                                                                        properties: {
                                                                          drawer: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            title: '{{ t("Edit record") }}',
                                                                            'x-component': 'Action.Container',
                                                                            'x-component-props': {
                                                                              className: 'nb-action-popup',
                                                                            },
                                                                            'x-app-version': '1.3.42-beta',
                                                                            properties: {
                                                                              tabs: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'void',
                                                                                'x-component': 'Tabs',
                                                                                'x-component-props': {},
                                                                                'x-initializer': 'popup:addTab',
                                                                                'x-app-version': '1.3.42-beta',
                                                                                properties: {
                                                                                  tab1: {
                                                                                    _isJSONSchemaObject: true,
                                                                                    version: '2.0',
                                                                                    type: 'void',
                                                                                    title: '{{t("Edit")}}',
                                                                                    'x-component': 'Tabs.TabPane',
                                                                                    'x-designer': 'Tabs.Designer',
                                                                                    'x-component-props': {},
                                                                                    'x-app-version': '1.3.42-beta',
                                                                                    properties: {
                                                                                      grid: {
                                                                                        _isJSONSchemaObject: true,
                                                                                        version: '2.0',
                                                                                        type: 'void',
                                                                                        'x-component': 'Grid',
                                                                                        'x-initializer':
                                                                                          'popup:common:addBlock',
                                                                                        'x-app-version': '1.3.42-beta',
                                                                                        properties: {
                                                                                          '5pwp67hvgii': {
                                                                                            _isJSONSchemaObject: true,
                                                                                            version: '2.0',
                                                                                            type: 'void',
                                                                                            'x-component': 'Grid.Row',
                                                                                            'x-app-version':
                                                                                              '1.3.42-beta',
                                                                                            properties: {
                                                                                              b02yo5jzqu1: {
                                                                                                _isJSONSchemaObject:
                                                                                                  true,
                                                                                                version: '2.0',
                                                                                                type: 'void',
                                                                                                'x-component':
                                                                                                  'Grid.Col',
                                                                                                'x-app-version':
                                                                                                  '1.3.42-beta',
                                                                                                properties: {
                                                                                                  '6bsqjxlo2l0': {
                                                                                                    _isJSONSchemaObject:
                                                                                                      true,
                                                                                                    version: '2.0',
                                                                                                    type: 'void',
                                                                                                    'x-acl-action':
                                                                                                      'image:get',
                                                                                                    'x-decorator':
                                                                                                      'DetailsBlockProvider',
                                                                                                    'x-use-decorator-props':
                                                                                                      'useDetailsDecoratorProps',
                                                                                                    'x-decorator-props':
                                                                                                      {
                                                                                                        dataSource:
                                                                                                          'main',
                                                                                                        collection:
                                                                                                          'image',
                                                                                                        readPretty:
                                                                                                          true,
                                                                                                        action: 'get',
                                                                                                      },
                                                                                                    'x-toolbar':
                                                                                                      'BlockSchemaToolbar',
                                                                                                    'x-settings':
                                                                                                      'blockSettings:details',
                                                                                                    'x-component':
                                                                                                      'CardItem',
                                                                                                    'x-app-version':
                                                                                                      '1.3.42-beta',
                                                                                                    properties: {
                                                                                                      juho6f9cld0: {
                                                                                                        _isJSONSchemaObject:
                                                                                                          true,
                                                                                                        version: '2.0',
                                                                                                        type: 'void',
                                                                                                        'x-component':
                                                                                                          'Details',
                                                                                                        'x-read-pretty':
                                                                                                          true,
                                                                                                        'x-use-component-props':
                                                                                                          'useDetailsProps',
                                                                                                        'x-app-version':
                                                                                                          '1.3.42-beta',
                                                                                                        properties: {
                                                                                                          '6xrgjg0w2j0':
                                                                                                            {
                                                                                                              _isJSONSchemaObject:
                                                                                                                true,
                                                                                                              version:
                                                                                                                '2.0',
                                                                                                              type: 'void',
                                                                                                              'x-initializer':
                                                                                                                'details:configureActions',
                                                                                                              'x-component':
                                                                                                                'ActionBar',
                                                                                                              'x-component-props':
                                                                                                                {
                                                                                                                  style:
                                                                                                                    {
                                                                                                                      marginBottom: 24,
                                                                                                                    },
                                                                                                                },
                                                                                                              'x-app-version':
                                                                                                                '1.3.42-beta',
                                                                                                              properties:
                                                                                                                {
                                                                                                                  tqtunfb7c5a:
                                                                                                                    {
                                                                                                                      _isJSONSchemaObject:
                                                                                                                        true,
                                                                                                                      version:
                                                                                                                        '2.0',
                                                                                                                      type: 'void',
                                                                                                                      title:
                                                                                                                        '{{ t("Edit") }}',
                                                                                                                      'x-action':
                                                                                                                        'update',
                                                                                                                      'x-toolbar':
                                                                                                                        'ActionSchemaToolbar',
                                                                                                                      'x-settings':
                                                                                                                        'actionSettings:edit',
                                                                                                                      'x-component':
                                                                                                                        'Action',
                                                                                                                      'x-component-props':
                                                                                                                        {
                                                                                                                          openMode:
                                                                                                                            'page',
                                                                                                                          icon: 'EditOutlined',
                                                                                                                          type: 'primary',
                                                                                                                        },
                                                                                                                      'x-action-context':
                                                                                                                        {
                                                                                                                          dataSource:
                                                                                                                            'main',
                                                                                                                          collection:
                                                                                                                            'image',
                                                                                                                        },
                                                                                                                      'x-decorator':
                                                                                                                        'ACLActionProvider',
                                                                                                                      'x-app-version':
                                                                                                                        '1.3.42-beta',
                                                                                                                      properties:
                                                                                                                        {
                                                                                                                          drawer:
                                                                                                                            {
                                                                                                                              _isJSONSchemaObject:
                                                                                                                                true,
                                                                                                                              version:
                                                                                                                                '2.0',
                                                                                                                              type: 'void',
                                                                                                                              title:
                                                                                                                                '{{ t("Edit record") }}',
                                                                                                                              'x-component':
                                                                                                                                'Action.Container',
                                                                                                                              'x-component-props':
                                                                                                                                {
                                                                                                                                  className:
                                                                                                                                    'nb-action-popup',
                                                                                                                                },
                                                                                                                              'x-app-version':
                                                                                                                                '1.3.42-beta',
                                                                                                                              properties:
                                                                                                                                {
                                                                                                                                  tabs: {
                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                      true,
                                                                                                                                    version:
                                                                                                                                      '2.0',
                                                                                                                                    type: 'void',
                                                                                                                                    'x-component':
                                                                                                                                      'Tabs',
                                                                                                                                    'x-component-props':
                                                                                                                                      {},
                                                                                                                                    'x-initializer':
                                                                                                                                      'popup:addTab',
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.3.42-beta',
                                                                                                                                    properties:
                                                                                                                                      {
                                                                                                                                        tab1: {
                                                                                                                                          _isJSONSchemaObject:
                                                                                                                                            true,
                                                                                                                                          version:
                                                                                                                                            '2.0',
                                                                                                                                          type: 'void',
                                                                                                                                          title:
                                                                                                                                            '{{t("Edit")}}',
                                                                                                                                          'x-component':
                                                                                                                                            'Tabs.TabPane',
                                                                                                                                          'x-designer':
                                                                                                                                            'Tabs.Designer',
                                                                                                                                          'x-component-props':
                                                                                                                                            {},
                                                                                                                                          'x-app-version':
                                                                                                                                            '1.3.42-beta',
                                                                                                                                          properties:
                                                                                                                                            {
                                                                                                                                              grid: {
                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                  true,
                                                                                                                                                version:
                                                                                                                                                  '2.0',
                                                                                                                                                type: 'void',
                                                                                                                                                'x-component':
                                                                                                                                                  'Grid',
                                                                                                                                                'x-initializer':
                                                                                                                                                  'popup:common:addBlock',
                                                                                                                                                'x-app-version':
                                                                                                                                                  '1.3.42-beta',
                                                                                                                                                properties:
                                                                                                                                                  {
                                                                                                                                                    xswkkgymq30:
                                                                                                                                                      {
                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                          true,
                                                                                                                                                        version:
                                                                                                                                                          '2.0',
                                                                                                                                                        type: 'void',
                                                                                                                                                        'x-component':
                                                                                                                                                          'Grid.Row',
                                                                                                                                                        'x-app-version':
                                                                                                                                                          '1.3.42-beta',
                                                                                                                                                        properties:
                                                                                                                                                          {
                                                                                                                                                            pq2gdv03h0f:
                                                                                                                                                              {
                                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                                  true,
                                                                                                                                                                version:
                                                                                                                                                                  '2.0',
                                                                                                                                                                type: 'void',
                                                                                                                                                                'x-component':
                                                                                                                                                                  'Grid.Col',
                                                                                                                                                                'x-app-version':
                                                                                                                                                                  '1.3.42-beta',
                                                                                                                                                                properties:
                                                                                                                                                                  {
                                                                                                                                                                    pmoy87u1q83:
                                                                                                                                                                      {
                                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                                          true,
                                                                                                                                                                        version:
                                                                                                                                                                          '2.0',
                                                                                                                                                                        type: 'void',
                                                                                                                                                                        'x-acl-action':
                                                                                                                                                                          'image:get',
                                                                                                                                                                        'x-decorator':
                                                                                                                                                                          'DetailsBlockProvider',
                                                                                                                                                                        'x-use-decorator-props':
                                                                                                                                                                          'useDetailsDecoratorProps',
                                                                                                                                                                        'x-decorator-props':
                                                                                                                                                                          {
                                                                                                                                                                            dataSource:
                                                                                                                                                                              'main',
                                                                                                                                                                            collection:
                                                                                                                                                                              'image',
                                                                                                                                                                            readPretty:
                                                                                                                                                                              true,
                                                                                                                                                                            action:
                                                                                                                                                                              'get',
                                                                                                                                                                          },
                                                                                                                                                                        'x-toolbar':
                                                                                                                                                                          'BlockSchemaToolbar',
                                                                                                                                                                        'x-settings':
                                                                                                                                                                          'blockSettings:details',
                                                                                                                                                                        'x-component':
                                                                                                                                                                          'CardItem',
                                                                                                                                                                        'x-app-version':
                                                                                                                                                                          '1.3.42-beta',
                                                                                                                                                                        properties:
                                                                                                                                                                          {
                                                                                                                                                                            krrpne6bx2e:
                                                                                                                                                                              {
                                                                                                                                                                                _isJSONSchemaObject:
                                                                                                                                                                                  true,
                                                                                                                                                                                version:
                                                                                                                                                                                  '2.0',
                                                                                                                                                                                type: 'void',
                                                                                                                                                                                'x-component':
                                                                                                                                                                                  'Details',
                                                                                                                                                                                'x-read-pretty':
                                                                                                                                                                                  true,
                                                                                                                                                                                'x-use-component-props':
                                                                                                                                                                                  'useDetailsProps',
                                                                                                                                                                                'x-app-version':
                                                                                                                                                                                  '1.3.42-beta',
                                                                                                                                                                                properties:
                                                                                                                                                                                  {
                                                                                                                                                                                    '4eixb6olg5s':
                                                                                                                                                                                      {
                                                                                                                                                                                        _isJSONSchemaObject:
                                                                                                                                                                                          true,
                                                                                                                                                                                        version:
                                                                                                                                                                                          '2.0',
                                                                                                                                                                                        type: 'void',
                                                                                                                                                                                        'x-initializer':
                                                                                                                                                                                          'details:configureActions',
                                                                                                                                                                                        'x-component':
                                                                                                                                                                                          'ActionBar',
                                                                                                                                                                                        'x-component-props':
                                                                                                                                                                                          {
                                                                                                                                                                                            style:
                                                                                                                                                                                              {
                                                                                                                                                                                                marginBottom: 24,
                                                                                                                                                                                              },
                                                                                                                                                                                          },
                                                                                                                                                                                        'x-app-version':
                                                                                                                                                                                          '1.3.42-beta',
                                                                                                                                                                                        'x-uid':
                                                                                                                                                                                          'mtk4qib0pmb',
                                                                                                                                                                                        'x-async':
                                                                                                                                                                                          false,
                                                                                                                                                                                        'x-index': 1,
                                                                                                                                                                                      },
                                                                                                                                                                                    grid: {
                                                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                                                        true,
                                                                                                                                                                                      version:
                                                                                                                                                                                        '2.0',
                                                                                                                                                                                      type: 'void',
                                                                                                                                                                                      'x-component':
                                                                                                                                                                                        'Grid',
                                                                                                                                                                                      'x-initializer':
                                                                                                                                                                                        'details:configureFields',
                                                                                                                                                                                      'x-app-version':
                                                                                                                                                                                        '1.3.42-beta',
                                                                                                                                                                                      properties:
                                                                                                                                                                                        {
                                                                                                                                                                                          '5qv0bbqybgm':
                                                                                                                                                                                            {
                                                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                                                true,
                                                                                                                                                                                              version:
                                                                                                                                                                                                '2.0',
                                                                                                                                                                                              type: 'void',
                                                                                                                                                                                              'x-component':
                                                                                                                                                                                                'Grid.Row',
                                                                                                                                                                                              'x-app-version':
                                                                                                                                                                                                '1.3.42-beta',
                                                                                                                                                                                              properties:
                                                                                                                                                                                                {
                                                                                                                                                                                                  x1e4gnfeupv:
                                                                                                                                                                                                    {
                                                                                                                                                                                                      _isJSONSchemaObject:
                                                                                                                                                                                                        true,
                                                                                                                                                                                                      version:
                                                                                                                                                                                                        '2.0',
                                                                                                                                                                                                      type: 'void',
                                                                                                                                                                                                      'x-component':
                                                                                                                                                                                                        'Grid.Col',
                                                                                                                                                                                                      'x-app-version':
                                                                                                                                                                                                        '1.3.42-beta',
                                                                                                                                                                                                      properties:
                                                                                                                                                                                                        {
                                                                                                                                                                                                          attachment:
                                                                                                                                                                                                            {
                                                                                                                                                                                                              _isJSONSchemaObject:
                                                                                                                                                                                                                true,
                                                                                                                                                                                                              version:
                                                                                                                                                                                                                '2.0',
                                                                                                                                                                                                              type: 'string',
                                                                                                                                                                                                              'x-toolbar':
                                                                                                                                                                                                                'FormItemSchemaToolbar',
                                                                                                                                                                                                              'x-settings':
                                                                                                                                                                                                                'fieldSettings:FormItem',
                                                                                                                                                                                                              'x-component':
                                                                                                                                                                                                                'CollectionField',
                                                                                                                                                                                                              'x-decorator':
                                                                                                                                                                                                                'FormItem',
                                                                                                                                                                                                              'x-collection-field':
                                                                                                                                                                                                                'image.attachment',
                                                                                                                                                                                                              'x-component-props':
                                                                                                                                                                                                                {},
                                                                                                                                                                                                              'x-use-component-props':
                                                                                                                                                                                                                'useAttachmentFieldProps',
                                                                                                                                                                                                              'x-app-version':
                                                                                                                                                                                                                '1.3.42-beta',
                                                                                                                                                                                                              'x-uid':
                                                                                                                                                                                                                'dhcu2vf5fxm',
                                                                                                                                                                                                              'x-async':
                                                                                                                                                                                                                false,
                                                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                                                            },
                                                                                                                                                                                                        },
                                                                                                                                                                                                      'x-uid':
                                                                                                                                                                                                        'yl57to4ttjy',
                                                                                                                                                                                                      'x-async':
                                                                                                                                                                                                        false,
                                                                                                                                                                                                      'x-index': 1,
                                                                                                                                                                                                    },
                                                                                                                                                                                                },
                                                                                                                                                                                              'x-uid':
                                                                                                                                                                                                'eyqz6iaciv5',
                                                                                                                                                                                              'x-async':
                                                                                                                                                                                                false,
                                                                                                                                                                                              'x-index': 1,
                                                                                                                                                                                            },
                                                                                                                                                                                        },
                                                                                                                                                                                      'x-uid':
                                                                                                                                                                                        '0sx8rthcy15',
                                                                                                                                                                                      'x-async':
                                                                                                                                                                                        false,
                                                                                                                                                                                      'x-index': 2,
                                                                                                                                                                                    },
                                                                                                                                                                                  },
                                                                                                                                                                                'x-uid':
                                                                                                                                                                                  'uh0vhvhnltl',
                                                                                                                                                                                'x-async':
                                                                                                                                                                                  false,
                                                                                                                                                                                'x-index': 1,
                                                                                                                                                                              },
                                                                                                                                                                          },
                                                                                                                                                                        'x-uid':
                                                                                                                                                                          'ogkh4von4yu',
                                                                                                                                                                        'x-async':
                                                                                                                                                                          false,
                                                                                                                                                                        'x-index': 1,
                                                                                                                                                                      },
                                                                                                                                                                  },
                                                                                                                                                                'x-uid':
                                                                                                                                                                  'lhgnxv5urvf',
                                                                                                                                                                'x-async':
                                                                                                                                                                  false,
                                                                                                                                                                'x-index': 1,
                                                                                                                                                              },
                                                                                                                                                          },
                                                                                                                                                        'x-uid':
                                                                                                                                                          '3rdklcguzy1',
                                                                                                                                                        'x-async':
                                                                                                                                                          false,
                                                                                                                                                        'x-index': 1,
                                                                                                                                                      },
                                                                                                                                                  },
                                                                                                                                                'x-uid':
                                                                                                                                                  'kbzczrd39z3',
                                                                                                                                                'x-async':
                                                                                                                                                  false,
                                                                                                                                                'x-index': 1,
                                                                                                                                              },
                                                                                                                                            },
                                                                                                                                          'x-uid':
                                                                                                                                            'saexcyuo5ao',
                                                                                                                                          'x-async':
                                                                                                                                            false,
                                                                                                                                          'x-index': 1,
                                                                                                                                        },
                                                                                                                                      },
                                                                                                                                    'x-uid':
                                                                                                                                      'l6gxsphiv7p',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                                },
                                                                                                                              'x-uid':
                                                                                                                                '5j05xhjnvhu',
                                                                                                                              'x-async':
                                                                                                                                false,
                                                                                                                              'x-index': 1,
                                                                                                                            },
                                                                                                                        },
                                                                                                                      'x-uid':
                                                                                                                        '9qid8vlu438',
                                                                                                                      'x-async':
                                                                                                                        false,
                                                                                                                      'x-index': 1,
                                                                                                                    },
                                                                                                                },
                                                                                                              'x-uid':
                                                                                                                'hnt0v2iaf1q',
                                                                                                              'x-async':
                                                                                                                false,
                                                                                                              'x-index': 1,
                                                                                                            },
                                                                                                          grid: {
                                                                                                            _isJSONSchemaObject:
                                                                                                              true,
                                                                                                            version:
                                                                                                              '2.0',
                                                                                                            type: 'void',
                                                                                                            'x-component':
                                                                                                              'Grid',
                                                                                                            'x-initializer':
                                                                                                              'details:configureFields',
                                                                                                            'x-app-version':
                                                                                                              '1.3.42-beta',
                                                                                                            properties:
                                                                                                              {
                                                                                                                '4ljipl6fcex':
                                                                                                                  {
                                                                                                                    _isJSONSchemaObject:
                                                                                                                      true,
                                                                                                                    version:
                                                                                                                      '2.0',
                                                                                                                    type: 'void',
                                                                                                                    'x-component':
                                                                                                                      'Grid.Row',
                                                                                                                    'x-app-version':
                                                                                                                      '1.3.42-beta',
                                                                                                                    properties:
                                                                                                                      {
                                                                                                                        o28cy7so1co:
                                                                                                                          {
                                                                                                                            _isJSONSchemaObject:
                                                                                                                              true,
                                                                                                                            version:
                                                                                                                              '2.0',
                                                                                                                            type: 'void',
                                                                                                                            'x-component':
                                                                                                                              'Grid.Col',
                                                                                                                            'x-app-version':
                                                                                                                              '1.3.42-beta',
                                                                                                                            properties:
                                                                                                                              {
                                                                                                                                attachment:
                                                                                                                                  {
                                                                                                                                    _isJSONSchemaObject:
                                                                                                                                      true,
                                                                                                                                    version:
                                                                                                                                      '2.0',
                                                                                                                                    type: 'string',
                                                                                                                                    'x-toolbar':
                                                                                                                                      'FormItemSchemaToolbar',
                                                                                                                                    'x-settings':
                                                                                                                                      'fieldSettings:FormItem',
                                                                                                                                    'x-component':
                                                                                                                                      'CollectionField',
                                                                                                                                    'x-decorator':
                                                                                                                                      'FormItem',
                                                                                                                                    'x-collection-field':
                                                                                                                                      'image.attachment',
                                                                                                                                    'x-component-props':
                                                                                                                                      {},
                                                                                                                                    'x-use-component-props':
                                                                                                                                      'useAttachmentFieldProps',
                                                                                                                                    'x-app-version':
                                                                                                                                      '1.3.42-beta',
                                                                                                                                    'x-uid':
                                                                                                                                      'u19h5djk1af',
                                                                                                                                    'x-async':
                                                                                                                                      false,
                                                                                                                                    'x-index': 1,
                                                                                                                                  },
                                                                                                                              },
                                                                                                                            'x-uid':
                                                                                                                              't1m1yr1sddj',
                                                                                                                            'x-async':
                                                                                                                              false,
                                                                                                                            'x-index': 1,
                                                                                                                          },
                                                                                                                      },
                                                                                                                    'x-uid':
                                                                                                                      'h3ok06z8mnt',
                                                                                                                    'x-async':
                                                                                                                      false,
                                                                                                                    'x-index': 1,
                                                                                                                  },
                                                                                                              },
                                                                                                            'x-uid':
                                                                                                              'gfw19ntb1ig',
                                                                                                            'x-async':
                                                                                                              false,
                                                                                                            'x-index': 2,
                                                                                                          },
                                                                                                        },
                                                                                                        'x-uid':
                                                                                                          '5lreqos5pcm',
                                                                                                        'x-async':
                                                                                                          false,
                                                                                                        'x-index': 1,
                                                                                                      },
                                                                                                    },
                                                                                                    'x-uid':
                                                                                                      '28dc9dbzmnd',
                                                                                                    'x-async': false,
                                                                                                    'x-index': 1,
                                                                                                  },
                                                                                                },
                                                                                                'x-uid': '0nwx7uvpdrw',
                                                                                                'x-async': false,
                                                                                                'x-index': 1,
                                                                                              },
                                                                                            },
                                                                                            'x-uid': 'vh98qnnifff',
                                                                                            'x-async': false,
                                                                                            'x-index': 1,
                                                                                          },
                                                                                        },
                                                                                        'x-uid': 'nklyrutj2hw',
                                                                                        'x-async': false,
                                                                                        'x-index': 1,
                                                                                      },
                                                                                    },
                                                                                    'x-uid': 'jzi0d8nhv9t',
                                                                                    'x-async': false,
                                                                                    'x-index': 1,
                                                                                  },
                                                                                },
                                                                                'x-uid': 'wiru51cp3bj',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': 'kcy9s6f3kll',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'k52k7dy2jyh',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'e9xf3xhivpu',
                                                                    'x-async': false,
                                                                    'x-index': 1,
                                                                  },
                                                                  grid: {
                                                                    _isJSONSchemaObject: true,
                                                                    version: '2.0',
                                                                    type: 'void',
                                                                    'x-component': 'Grid',
                                                                    'x-initializer': 'details:configureFields',
                                                                    'x-app-version': '1.3.42-beta',
                                                                    properties: {
                                                                      pmh5rz8nxf0: {
                                                                        _isJSONSchemaObject: true,
                                                                        version: '2.0',
                                                                        type: 'void',
                                                                        'x-component': 'Grid.Row',
                                                                        'x-app-version': '1.3.42-beta',
                                                                        properties: {
                                                                          wdi21i7x7th: {
                                                                            _isJSONSchemaObject: true,
                                                                            version: '2.0',
                                                                            type: 'void',
                                                                            'x-component': 'Grid.Col',
                                                                            'x-app-version': '1.3.42-beta',
                                                                            properties: {
                                                                              attachment: {
                                                                                _isJSONSchemaObject: true,
                                                                                version: '2.0',
                                                                                type: 'string',
                                                                                'x-toolbar': 'FormItemSchemaToolbar',
                                                                                'x-settings': 'fieldSettings:FormItem',
                                                                                'x-component': 'CollectionField',
                                                                                'x-decorator': 'FormItem',
                                                                                'x-collection-field':
                                                                                  'image.attachment',
                                                                                'x-component-props': {},
                                                                                'x-use-component-props':
                                                                                  'useAttachmentFieldProps',
                                                                                'x-app-version': '1.3.42-beta',
                                                                                'x-uid': 'nsxtdx4v0on',
                                                                                'x-async': false,
                                                                                'x-index': 1,
                                                                              },
                                                                            },
                                                                            'x-uid': '7jwrrijskjo',
                                                                            'x-async': false,
                                                                            'x-index': 1,
                                                                          },
                                                                        },
                                                                        'x-uid': 'ioxlkouqs1s',
                                                                        'x-async': false,
                                                                        'x-index': 1,
                                                                      },
                                                                    },
                                                                    'x-uid': 'c7v6g526r3o',
                                                                    'x-async': false,
                                                                    'x-index': 2,
                                                                  },
                                                                },
                                                                'x-uid': 'xvnohfnt59r',
                                                                'x-async': false,
                                                                'x-index': 1,
                                                              },
                                                            },
                                                            'x-uid': '2w9fddhi7ig',
                                                            'x-async': false,
                                                            'x-index': 1,
                                                          },
                                                        },
                                                        'x-uid': '2wm58u6r3pu',
                                                        'x-async': false,
                                                        'x-index': 1,
                                                      },
                                                    },
                                                    'x-uid': '1gl08rddg53',
                                                    'x-async': false,
                                                    'x-index': 1,
                                                  },
                                                },
                                                'x-uid': 'ljevsl3tauf',
                                                'x-async': false,
                                                'x-index': 1,
                                              },
                                            },
                                            'x-uid': 'ldqvb7su74d',
                                            'x-async': false,
                                            'x-index': 1,
                                          },
                                        },
                                        'x-uid': 'a6vwhe6f4di',
                                        'x-async': false,
                                        'x-index': 1,
                                      },
                                    },
                                    'x-uid': 'ufel6b95xab',
                                    'x-async': false,
                                    'x-index': 1,
                                  },
                                },
                                'x-uid': 'ynfe2e3advc',
                                'x-async': false,
                                'x-index': 1,
                              },
                            },
                            'x-uid': 'muv6sn88u21',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-async': false,
                        'x-index': 1,
                      },
                      aeie2yj3330: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-decorator': 'TableV2.Column.Decorator',
                        'x-toolbar': 'TableColumnSchemaToolbar',
                        'x-settings': 'fieldSettings:TableColumn',
                        'x-component': 'TableV2.Column',
                        'x-app-version': '1.3.42-beta',
                        properties: {
                          attachment: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            'x-collection-field': 'image.attachment',
                            'x-component': 'CollectionField',
                            'x-component-props': {
                              size: 'small',
                            },
                            'x-read-pretty': true,
                            'x-decorator': null,
                            'x-decorator-props': {
                              labelStyle: {
                                display: 'none',
                              },
                            },
                            'x-use-component-props': 'useAttachmentFieldProps',
                            'x-app-version': '1.3.42-beta',
                            'x-uid': 'v8ob310s6rw',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'nl49qq20w9u',
                        'x-async': false,
                        'x-index': 2,
                      },
                    },
                    'x-uid': 'mmmy06sb66h',
                    'x-async': false,
                    'x-index': 2,
                  },
                },
                'x-uid': '544lfyanyxa',
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': '8o70uof3o2h',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'hi06e74rl8e',
        'x-async': false,
        'x-index': 1,
      },
    },
    name: 'q8vu8vaasre',
    'x-uid': 'q8vu8vaasre',
    'x-async': true,
    'x-index': 1,
  },
};
