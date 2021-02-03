import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef, createRef } from 'react';
import { Button, Drawer, Modal } from 'antd';
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
  FormEffectHooks,
  FormSpy,
  LifeCycleTypes,
} from '@formily/antd';
import { merge } from '@formily/shared';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import api from '@/api-client';
import { Spin } from '@nocobase/client';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import cleanDeep from 'clean-deep';
import scopes from './scopes';

export const DrawerForm = forwardRef((props: any, ref) => {
  console.log('DrawerForm', props);
  const {
    activeTab = {},
    pageInfo = {},
    schema,
    resourceName,
    associatedName,
    associatedKey,
    onFinish,
  } = props;
  const [state, setState] = useState<any>({});
  const [form, setForm] = useState<any>({});
  const [changed, setChanged] = useState(false);
  console.log(associatedKey);
  const { title, initialValues = {}, actionDefaultParams = {}, fields = {} } = props.schema||{};
  const [resourceKey, setResourceKey] = useState(props.resourceKey);
  const [visible, setVisible] = useState(false);
  const name = associatedName ? `${associatedName}.${resourceName}` : resourceName;
  const { data = {}, run, loading } = useRequest((resourceKey) => {
    setResourceKey(resourceKey);
    return api.resource(name).get({
      resourceKey,
      associatedKey,
      ...actionDefaultParams,
    });
  }, {
    manual: true,
  });
  useImperativeHandle(ref, () => ({
    setVisible,
    getData: run,
  }));
  const { displayFormFields = [] } = activeTab;
  const properties: any ={};
  for (const key in fields) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      const field = fields[key];
      if (Array.isArray(displayFormFields) && displayFormFields.length && displayFormFields.indexOf(field.id) === -1) {
        continue;
      }
      properties[key] = field;
    }
  }
  return (
    <Drawer
      {...props}
      destroyOnClose
      visible={visible}
      width={'40%'}
      className={'noco-drawer'}
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
        <Button onClick={() => {
          setVisible(false);
          setChanged(false);
        }}>取消</Button>
        <span style={{display: 'inline-block', width: 8}}> </span>
        <Button loading={state.submitting} type={'primary'} onClick={async () => {
          await form.submit();
        }}>提交</Button>
        </div>
      )}
    >
      {loading ? <Spin/> : (
        <SchemaForm 
          colon={true}
          layout={'vertical'}
          // 暂时先这么处理，如果有 associatedKey 注入表单里
          initialValues={{associatedKey, resourceKey, ...initialValues, ...data}}
          // actions={actions}
          schema={{
            type: 'object',
            properties,
          }}
          autoComplete={'off'}
          expressionScope={scopes}
          onChange={(values) => {
            setChanged(true);
          }}
          onSubmit={async (values) => {
            console.log(values);
            console.log('submitsubmitsubmit', values);
            if (resourceKey) {
              await api.resource(name).update({
                resourceKey,
                associatedKey,
                values,
              });
            } else {
              await api.resource(name).create({
                associatedKey,
                values,
              });
            }
            setVisible(false);
            setChanged(false);
            // @ts-ignore
            window.routesReload && window.routesReload();
            onFinish && onFinish(values);
          }}
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
      )}
    </Drawer>
  );
});
