import React, { useContext, useEffect } from 'react';
import { Button, Dropdown, Menu, Select } from 'antd';
import { useHistory } from 'react-router-dom';
import { SchemaField } from '../../schemas';
import { AuthContext, useCurrentUser } from './Auth';
import { FormButtonGroup, FormDrawer, FormLayout, Submit } from '@formily/antd';
import { useState } from 'react';
import { useClient } from '../../constate';
import { useTranslation } from 'react-i18next';

export const UserInfo = () => {
  const history = useHistory();
  const { service, currentUser } = useContext(AuthContext);
  const [visible, setVisible] = useState(false);
  const { request } = useClient();
  const { t, i18n } = useTranslation();
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ marginRight: 16, display: 'inline-block' }}>
                角色切换
              </span>
              <Select
                className={'roles-select'}
                bordered={false}
                style={{ minWidth: 100 }}
                size={'small'}
                defaultValue={'admin'}
                disabled
                options={[
                  { label: '超级管理员', value: 'admin' },
                  { label: '数据管理员', value: 'editor' },
                  { label: '普通成员', value: 'member' },
                ]}
              />
            </div>
          </Menu.Item>
          <Menu.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ marginRight: 16, display: 'inline-block' }}>
                语言设置
              </span>
              <Select
                className={'roles-select'}
                bordered={false}
                size={'small'}
                defaultValue={i18n.language}
                onChange={(value) => {
                  i18n.changeLanguage(value);
                }}
                options={[
                  { label: '简体中文', value: 'zh-CN' },
                  { label: 'English', value: 'en-US' },
                ]}
              />
            </div>
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
