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
  FormEffectHooks,
} from '@formily/antd';
import { merge } from '@formily/shared';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { useRequest } from 'umi';
import api from '@/api-client';
import { Spin } from '@nocobase/client';

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
  const actions = createFormActions();
  console.log({onFinish});
  return (
    <Drawer
      {...props}
      destroyOnClose
      visible={visible}
      width={'40%'}
      onClose={() => {
        setVisible(false);
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
          initialValues={{associatedKey, ...data}}
          actions={actions}
          schema={{
            type: 'object',
            properties,
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
      )}
    </Drawer>
  );
});
