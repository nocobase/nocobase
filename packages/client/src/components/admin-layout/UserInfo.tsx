import React, { useContext, useEffect } from 'react';
import { Button, Dropdown, Menu } from 'antd';
import { useHistory } from 'react-router-dom';
import { request, SchemaField } from '../../schemas';
import { AuthContext, useCurrentUser } from './Auth';
import { FormButtonGroup, FormDrawer, FormLayout, Submit } from '@formily/antd';

export const UserInfo = () => {
  const history = useHistory();
  const { service, currentUser } = useContext(AuthContext);
  return (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item
            onClick={async () => {
              const values = await FormDrawer('个人资料', () => {
                return (
                  <FormLayout layout={'vertical'}>
                    <SchemaField
                      schema={{
                        type: 'object',
                        properties: {
                          email: {
                            type: 'string',
                            title: '邮箱',
                            'x-component': 'Input',
                            'x-decorator': 'FormilyFormItem',
                          },
                          nickname: {
                            type: 'string',
                            title: '昵称',
                            'x-component': 'Input',
                            'x-decorator': 'FormilyFormItem',
                          },
                        },
                      }}
                    />
                    <FormDrawer.Footer>
                      <FormButtonGroup align="right">
                        <Submit onSubmit={(values) => {
                        }}>
                          保存
                        </Submit>
                      </FormButtonGroup>
                    </FormDrawer.Footer>
                  </FormLayout>
                );
              }).open({
                initialValues: currentUser || {},
              });
              const { data } = await request('users:updateProfile', {
                method: 'post',
                data: values,
              });
              service.mutate(data);
            }}
          >
            个人资料
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            onClick={async () => {
              await request('users:logout');
              localStorage.removeItem('NOCOBASE_TOKEN');
              history.push('/login');
            }}
          >
            退出登录
          </Menu.Item>
        </Menu>
      }
    >
      <Button type={'text'} className={'user-info'}>
        {currentUser?.nickname || currentUser?.email}
      </Button>
    </Dropdown>
  );
};
