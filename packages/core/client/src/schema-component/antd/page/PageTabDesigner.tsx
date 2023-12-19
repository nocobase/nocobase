import { DragOutlined } from '@ant-design/icons';
import { useFieldSchema } from '@formily/react';
import { Space } from 'antd';
import React from 'react';
import { DragHandler, useDesignable } from '../..';
import { useGetAriaLabelOfDesigner } from '../../../schema-settings/hooks/useGetAriaLabelOfDesigner';
import { SchemaToolbarProvider, useSchemaSettingsRender } from '../../../application';

export const PageDesigner = ({ title }) => {
  const { designable } = useDesignable();
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaSettingsRender(
    fieldSchema['x-settings'] || 'PageSettings',
    fieldSchema['x-settings-props'],
  );
  if (!designable) {
    return null;
  }
  return (
    <SchemaToolbarProvider title={title}>
      <div className={'general-schema-designer'}>
        <div className={'general-schema-designer-icons'}>
          <Space size={2} align={'center'}>
            {render()}
          </Space>
        </div>
      </div>
    </SchemaToolbarProvider>
  );
};

export const PageTabDesigner = ({ schema }) => {
  const { designable } = useDesignable();
  const { getAriaLabel } = useGetAriaLabelOfDesigner();
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaSettingsRender(
    fieldSchema['x-settings'] || 'PageTabSettings',
    fieldSchema['x-settings-props'],
  );
  if (!designable) {
    return null;
  }
  return (
    <SchemaToolbarProvider schema={schema}>
      <div className={'general-schema-designer'}>
        <div className={'general-schema-designer-icons'}>
          <Space size={3} align={'center'}>
            <DragHandler>
              <DragOutlined style={{ marginRight: 0 }} role="button" aria-label={getAriaLabel('drag-handler', 'tab')} />
            </DragHandler>
            {render()}
          </Space>
        </div>
      </div>
    </SchemaToolbarProvider>
  );
};
