import { createForm } from '@formily/core';
import { FormContext, ISchema } from '@formily/react';
import { Button, Space } from 'antd';
import React, { useMemo } from 'react';
import { SchemaComponent } from '../';
import { AntdSchemaComponentProvider } from '../schema-component';

const schema: ISchema = {
  type: 'object',
  properties: {
    scope: {
      type: 'array',
      default: [
        { id: 1, name: 'name1' },
        { id: 2, name: 'name2' },
      ],
      'x-component': 'RecordPicker',
      properties: {
        actions: {
          'x-component': 'ScopeActions',
        },
        rowSelection: {
          'x-component': 'RowSelection',
          'x-component-props': {
            rowKey: 'id',
            objectValue: true,
            rowSelection: {
              type: 'radio',
            },
            dataSource: [
              { id: 1, title: '全部数据' },
              { id: 2, title: '用户自己创建的数据' },
              { id: 3, title: '待审核的文章' },
            ],
          },
          properties: {
            column1: {
              type: 'void',
              title: '数据范围',
              'x-component': 'RowSelection.Column',
              'x-read-pretty': true,
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'Input',
                  'x-read-pretty': true,
                },
              },
            },
          },
        },
      },
    },
  },
};

const ScopeActions = () => {
  return (
    <Space style={{ justifyContent: 'flex-end', width: '100%', marginBottom: 16 }}>
      <Button key="destroy">删除</Button>
      <Button type={'primary'} key="create">
        添加
      </Button>
    </Space>
  );
};

export const ScopeRecordPicker = () => {
  const form = useMemo(() => createForm({}), []);
  return (
    <FormContext.Provider value={form}>
      <AntdSchemaComponentProvider>
        <SchemaComponent components={{ ScopeActions }} schema={schema} />
      </AntdSchemaComponentProvider>
    </FormContext.Provider>
  );
};
