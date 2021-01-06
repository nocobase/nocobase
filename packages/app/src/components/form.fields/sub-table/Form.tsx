import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { Button, Drawer } from 'antd';
import { Tooltip, Input, Space, Modal } from 'antd';
import isEqual from 'lodash/isEqual';
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
import { useRequest } from 'umi';
import api from '@/api-client';
import { Spin } from '@nocobase/client';

const actions = createFormActions();

export default forwardRef((props: any, ref) => {
  console.log(props);
  const {
    target,
    onFinish,
  } = props;
  const { data: schema = {}, loading } = useRequest(() => api.resource(target).getView({
    resourceKey: 'form'
  }));
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState({});
  const [title, setTitle] = useState('创建子字段');
  const [index, setIndex] = useState();
  useImperativeHandle(ref, () => ({
    setVisible,
    setData,
    setTitle,
    setIndex,
  }));
  console.log({onFinish});
  const { fields = {} } = schema;
  if (loading) {
    return <Spin/>;
  }
  return (
    <Drawer
      {...props}
      destroyOnClose
      visible={visible}
      className={'noco-drawer'}
      width={'40%'}
      onClose={() => {
        actions.getFormState(state => {
          if (isEqual(state.initialValues, state.values)) {
            setVisible(false);
            return;
          }
          Modal.confirm({
            title: '表单内容发生变化，确定不保存吗？',
            onOk() {
              setVisible(false);
            }
          });
        });
      }}
      title={title}
      footer={(
        <div
          style={{
            textAlign: 'right',
          }}
        >
          <Space>
            <Button onClick={() => setVisible(false)}>取消</Button>
            <Button type={'primary'} onClick={async () => {
              const { values = {} } = await actions.submit();
              setVisible(false);
              onFinish && onFinish(values, index);
            }}>提交</Button>
          </Space>
        </div>
      )}
    >
      <SchemaForm 
        colon={true}
        layout={'vertical'}
        initialValues={data}
        actions={actions}
        schema={{
          type: 'object',
          properties: fields,
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
