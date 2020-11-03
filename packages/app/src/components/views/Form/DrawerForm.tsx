import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { Button, Drawer } from 'antd';
import { Tooltip, Input } from 'antd';
import {
  SchemaForm,
  SchemaMarkupField as Field,
  createFormActions,
  createAsyncFormActions,
  Submit,
  Reset,
  FormButtonGroup,
  registerFormFields,
  FormValidator,
  setValidationLanguage,
} from '@formily/antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

export const DrawerForm = forwardRef((props: any, ref) => {
  const [visible, setVisible] = useState(false);
  useImperativeHandle(ref, () => ({
    setVisible,
  }));
  const actions = createAsyncFormActions();
  return (
    <Drawer
      {...props}
      destroyOnClose
      visible={visible}
      width={'40%'}
      onClose={() => {
        setVisible(false);
      }}
      footer={[
        <Button type={'primary'} onClick={async () => {
          await actions.submit();
        }}>提交</Button>
      ]}
    >
      <SchemaForm 
        colon={true}
        layout={'vertical'}
        initialValues={{}}
        actions={actions}
        schema={{
          type: 'object',
          properties: {
            title: {
              type: 'string',
              title: '标题',
              required: true,
            },
          },
        }}
        expressionScope={{
          text(...args: any[]) {
            return React.createElement('span', {}, ...args)
          },
          tooltip(title: string, offset = 3) {
            return (
              <Tooltip title={title}>
                <QuestionCircleOutlined
                  style={{ margin: '0 3px', cursor: 'default', marginLeft: offset }}
                />
              </Tooltip>
            );
          },
        }}
      >
      </SchemaForm>
    </Drawer>
  );
});
