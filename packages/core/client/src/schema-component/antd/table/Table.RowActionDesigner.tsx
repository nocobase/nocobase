import { DragOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { DragHandler } from '../../../schema-component';
import { useApp } from '../../../application';

export const TableRowActionDesigner = (props: any) => {
  const fieldSchema = useFieldSchema();
  const app = useApp();
  const { render } = app.schemaInitializerManager.getRender(
    fieldSchema['x-initializer'],
    fieldSchema['x-initializer-props'],
  );
  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <DragHandler>
            <DragOutlined />
          </DragHandler>
          {render()}
        </Space>
      </div>
    </div>
  );
};
