import { DragOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { DragHandler } from '../../../schema-component';
import { useSchemaInitializer } from '../../../schema-initializer';
import { useGetLabelOfDesigner } from '../../../schema-settings/hooks/useGetLabelOfDesigner';

export const TableActionColumnDesigner = (props: any) => {
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializer(fieldSchema['x-initializer']);
  const { getLabel } = useGetLabelOfDesigner();
  return (
    <div className={'general-schema-designer'}>
      <div className={'general-schema-designer-icons'}>
        <Space size={2} align={'center'}>
          <DragHandler>
            <DragOutlined role="button" aria-label={getLabel('drag-handler')} />
          </DragHandler>
          {render()}
        </Space>
      </div>
    </div>
  );
};
