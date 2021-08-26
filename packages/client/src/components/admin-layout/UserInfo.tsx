import React, { useContext, useEffect } from 'react';
import { Button, Dropdown, Menu, Select } from 'antd';
import { useHistory } from 'react-router-dom';
import { request, SchemaField } from '../../schemas';
import { AuthContext, useCurrentUser } from './Auth';
import { FormButtonGroup, FormDrawer, FormLayout, Submit } from '@formily/antd';
import { useState } from 'react';

export const UserInfo = () => {
  const history = useHistory();
  const { service, currentUser } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);
  return (
    <Dropdown
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.Item
            onClick={async () => {
              setVisible(false);
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
                        <Submit onSubmit={(values) => {}}>保存</Submit>
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
          <Menu.Item>
            <Select
              className={'roles-select'}
              bordered={false}
              style={{ minWidth: 100, paddingLeft: 0 }}
              size={'small'}
              defaultValue={'admin'}
              options={[
                { label: '超级管理员', value: 'admin' },
                { label: '数据管理员', value: 'editor' },
                { label: '普通成员', value: 'member' },
              ]}
            />
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
