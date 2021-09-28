import React from 'react';
import { ISchema, SchemaRenderer } from '../../';
import { useSelect, useOptionTagValues } from '../';
import { uid } from '@formily/shared';
import { CollectionsProvider } from '@nocobase/client/src/constate';

console.log({ useSelect });

const dataSource = [
  {
    id: 1,
    title: '标题1',
  },
  {
    id: 2,
    title: '标题2',
  },
  {
    id: 3,
    title: '标题3',
  },
] as any[];

function useValues() {
  return {
    table: dataSource,
  };
}

const schema: ISchema = {
  type: 'object',
  properties: {
    input: {
      interface: 'select',
      type: 'string',
      title: `编辑模式`,
      enum: dataSource,
      default: [
        {
          id: 1,
          title: '标题1',
        },
        {
          id: 2,
          title: '标题2',
        },
      ],
      'x-decorator': 'FormItem',
      'x-component': 'Select.Drawer',
      'x-component-props': {
        placeholder: 'please enter',
        mode: 'tags',
        fieldNames: {
          label: 'title',
          value: 'id',
        },
      },
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
      properties: {
        options: {
          type: 'void',
          'x-decorator': 'Form',
          'x-component': 'Select.Options.Drawer',
          title: '关联数据',
          properties: {
            table: {
              type: 'array',
              'x-designable-bar': 'Table.DesignableBar',
              'x-decorator': 'BlockItem',
              'x-decorator-props': {
                draggable: false,
              },
              'x-component': 'Table',
              default: [],
              'x-component-props': {
                rowKey: 'id',
                collectionName: 'users',
                // dragSort: true,
                showIndex: true,
                refreshRequestOnChange: true,
                pagination: {
                  pageSize: 10,
                },
              },
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Table.ActionBar',
                  'x-designable-bar': 'Table.ActionBar.DesignableBar',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      title: '筛选',
                      'x-decorator': 'AddNew.Displayed',
                      'x-decorator-props': {
                        displayName: 'filter',
                      },
                      'x-align': 'left',
                      'x-component': 'Table.Filter',
                      'x-designable-bar': 'Table.Filter.DesignableBar',
                      'x-component-props': {
                        fieldNames: [],
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
    read: {
      interface: 'select',
      type: 'string',
      title: `阅读模式`,
      enum: dataSource,
      default: [
        {
          id: 1,
          title: '标题1',
        },
        {
          id: 2,
          title: '标题2',
        },
      ],
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Drawer',
      'x-component-props': {
        placeholder: 'please enter',
        mode: 'tags',
        fieldNames: {
          label: 'title',
          value: 'id',
        },
      },
      properties: {
        option: {
          type: 'void',
          'x-component': 'Select.OptionTag',
          properties: {
            [uid()]: {
              type: 'void',
              title: '查看数据',
              'x-component': 'Action.Drawer',
              'x-component-props': {
                bodyStyle: {
                  background: '#f0f2f5',
                  // paddingTop: 0,
                },
              },
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Tabs',
                  'x-designable-bar': 'Tabs.DesignableBar',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      title: '详情',
                      'x-designable-bar': 'Tabs.TabPane.DesignableBar',
                      'x-component': 'Tabs.TabPane',
                      'x-component-props': {},
                      properties: {
                        [uid()]: {
                          type: 'void',
                          'x-component': 'Grid',
                          'x-component-props': {
                            addNewComponent: 'AddNew.PaneItem',
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
      },
    },
  },
};

export default () => {
  return (
    <CollectionsProvider>
      <SchemaRenderer
        scope={{ useSelect, useValues, useOptionTagValues }}
        schema={schema}
      />
    </CollectionsProvider>
  );
};
