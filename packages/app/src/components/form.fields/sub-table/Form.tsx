import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { Button, Drawer } from 'antd';
import { Tooltip, Input, Space, Modal } from 'antd';
import isEqual from 'lodash/isEqual';
import {
  SchemaForm,
  SchemaMarkupField as Field,
  createFormActions,
  FormSpy,
  LifeCycleTypes,
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
import cleanDeep from 'clean-deep';
import scopes from '@/components/views/Form/scopes';

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
  const [state, setState] = useState<any>({});
  const [form, setForm] = useState<any>({});
  const [changed, setChanged] = useState(false);
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
        if (changed) {
          Modal.confirm({
            title: '表单内容发生变化，确定不保存吗？',
            onOk() {
              setChanged(false);
              setVisible(false);
            }
          });
        } else {
          setChanged(false);
          setVisible(false);
        }
      }}
      title={title}
      footer={(
        <div
          style={{
            textAlign: 'right',
          }}
        >
          <Space>
            <Button onClick={() => {
              setVisible(false);
              setChanged(false);
            }}>取消</Button>
            <Button type={'primary'} onClick={async () => {
              await form.submit();
              // const { values = {} } = await actions.submit();
              // setVisible(false);
              // onFinish && onFinish(values, index);
            }}>提交</Button>
          </Space>
        </div>
      )}
    >
      <SchemaForm 
        colon={true}
        layout={'vertical'}
        initialValues={data}
        onChange={(values) => {
          setChanged(true);
        }}
        onSubmit={async (values) => {
          setVisible(false);
          setChanged(false);
          onFinish && onFinish(values, index);
        }}
        // actions={actions}
        schema={{
          type: 'object',
          properties: fields,
        }}
        expressionScope={scopes}
      >
        <FormSpy
          selector={[
            LifeCycleTypes.ON_FORM_MOUNT,
            LifeCycleTypes.ON_FORM_SUBMIT_START,
            LifeCycleTypes.ON_FORM_SUBMIT_END
          ]}
          reducer={(state, action) => {
            switch (action.type) {
              case LifeCycleTypes.ON_FORM_SUBMIT_START:
                return {
                  ...state,
                  submitting: true
                }
              case LifeCycleTypes.ON_FORM_SUBMIT_END:
                return {
                  ...state,
                  submitting: false
                }
              default:
                return state
            }
          }}
        >
          {({ state, form }) => {
            setState(state)
            setForm(form);
            return <div/>
          }}
        </FormSpy>
      </SchemaForm>
    </Drawer>
  );
});
