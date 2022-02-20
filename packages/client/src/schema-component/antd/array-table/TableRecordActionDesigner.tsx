import { DragOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { DragHandler, useComponent } from '../../../schema-component';

export const TableRecordActionDesigner = (props: any) => {
  const fieldSchema = useFieldSchema();
  const ActionInitializer = useComponent(fieldSchema['x-action-initializer']);
  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <DragHandler>
            <DragOutlined />
          </DragHandler>
          <ActionInitializer />
        </Space>
      </div>
    </div>
  );
};
