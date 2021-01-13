import React, { useState, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
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

const actions = createFormActions();

export const DrawerForm = forwardRef((props: any, ref) => {
  console.log(props);
  const {
    activeTab = {},
    pageInfo = {},
    schema,
    resourceName,
    associatedName,
    associatedKey,
    onFinish,
  } = props;
  console.log(associatedKey);
  const { title, actionDefaultParams = {}, fields: properties ={} } = props.schema||{};
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
  
  console.log({onFinish});
  return (
    <Drawer
      {...props}
      destroyOnClose
      visible={visible}
      width={'40%'}
      className={'noco-drawer'}
      onClose={() => {
        actions.getFormState(state => {
          const values = cleanDeep(state.values);
          const others = Object.keys(data).length ? cleanDeep({...data, associatedKey, resourceKey}) : cleanDeep(state.initialValues);
          if (isEqual(values, others)) {
            setVisible(false);
            return;
          }
          for (const key in values) {
            if (Object.prototype.hasOwnProperty.call(values, key)) {
              const value = values[key];
              const other = others[key];
              if (!isEqual(value, other)) {
                // console.log(value, other, values, others, state.initialValues);
                Modal.confirm({
                  title: '表单内容发生变化，确定不保存吗？',
                  onOk() {
                    setVisible(false);
                  }
                });
                return;
              }
            }
          }
          setVisible(false);
        });
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
        }}>取消</Button>
        <span style={{display: 'inline-block', width: 8}}> </span>
        <Button type={'primary'} onClick={async () => {
          const { values = {} } = await actions.submit();
          console.log(values);
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
          // @ts-ignore
          window.routesReload && window.routesReload();
          onFinish && onFinish(values);
        }}>提交</Button>
        </div>
      )}
    >
      {loading ? <Spin/> : (
        <SchemaForm 
          colon={true}
          layout={'vertical'}
          // 暂时先这么处理，如果有 associatedKey 注入表单里
          initialValues={{associatedKey, resourceKey, ...data}}
          actions={actions}
          schema={{
            type: 'object',
            properties,
          }}
          autoComplete={'off'}
          expressionScope={scopes}
        >
        </SchemaForm>
      )}
    </Drawer>
  );
});
