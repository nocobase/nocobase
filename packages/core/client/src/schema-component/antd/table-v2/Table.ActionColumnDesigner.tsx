import { DragOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { DragHandler } from '../../../schema-component';
import { useApp } from '../../../application';

export const TableActionColumnDesigner = (props: any) => {
  const fieldSchema = useFieldSchema();
  const app = useApp();
  const element = app.schemaInitializerManager.render(fieldSchema['x-initializer'], fieldSchema['x-initializer-props']);
  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <DragHandler>
            <DragOutlined />
          </DragHandler>
          {element}
        </Space>
      </div>
    </div>
  );
};
