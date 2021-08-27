import React from 'react';
import { ISchema, SchemaRenderer } from '../../';
import { Calendar } from '..';
import events from './events';
import { uid } from '@formily/shared';

const schema: ISchema = {
  type: 'array',
  name: 'calendar1',
  'x-component': 'Calendar',
  'x-component-props': {
    fieldNames: {
      title: '',
      startTime: '',
      endTime: '',
    },
  },
  default: events,
  properties: {
    toolbar: {
      type: 'void',
      'x-component': 'Calendar.Toolbar',
      properties: {
        today: {
          type: 'void',
          title: '今天',
          'x-designable-bar': 'Calendar.ActionDesignableBar',
          'x-component': 'Calendar.Today',
          'x-align': 'left',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'today',
          },
        },
        nav: {
          type: 'void',
          title: '翻页',
          'x-designable-bar': 'Calendar.ActionDesignableBar',
          'x-component': 'Calendar.Nav',
          'x-align': 'left',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'nav',
          },
        },
        title: {
          type: 'void',
          title: '标题',
          'x-designable-bar': 'Calendar.ActionDesignableBar',
          'x-component': 'Calendar.Title',
          'x-align': 'left',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'title',
          },
        },
        viewSelect: {
          type: 'void',
          title: '视图切换',
          'x-designable-bar': 'Calendar.ActionDesignableBar',
          'x-component': 'Calendar.ViewSelect',
          'x-align': 'right',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'viewSelect',
          },
        },
        filter: {
          type: 'void',
          title: '过滤',
          'x-align': 'right',
          'x-designable-bar': 'Calendar.Filter.DesignableBar',
          'x-component': 'Calendar.Filter',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'filter',
          },
        },
        create: {
          type: 'void',
          title: '新增',
          'x-align': 'right',
          'x-designable-bar': 'Calendar.ActionDesignableBar',
          'x-component': 'Action',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'create',
          },
          'x-component-props': {
            type: 'primary',
          },
          properties: {
            modal: {
              type: 'void',
              title: '添加数据',
              'x-decorator': 'Form',
              'x-component': 'Action.Drawer',
              'x-component-props': {
                // useOkAction: '{{ Calendar.useTableCreateAction }}',
              },
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-component-props': {
                    addNewComponent: 'AddNew.FormItem',
                  },
                },
              },
            },
          },
        },
      },
    },
    event: {
      type: 'void',
      'x-component': 'Calendar.Event',
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Grid',
          'x-component-props': {
            addNewComponent: 'AddNew.FormItem',
          },
        },
      },
    },
  },
};

export default () => {
  return <SchemaRenderer components={{ Calendar }} schema={schema} />;
};
