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
              const values = await FormDrawer(t('My profile'), () => {
                return (
                  <FormLayout layout={'vertical'}>
                    <SchemaField
                      schema={{
                        type: 'object',
                        properties: {
                          email: {
                            type: 'string',
                            title: t('Email'),
                            'x-component': 'Input',
                            'x-decorator': 'FormilyFormItem',
                          },
                          nickname: {
                            type: 'string',
                            title: t('Nickname'),
                            'x-component': 'Input',
                            'x-decorator': 'FormilyFormItem',
                          },
                        },
                      }}
                    />
                    <FormDrawer.Footer>
                      <FormButtonGroup align="right">
                        <Submit onSubmit={(values) => {}}>{t('Submit')}</Submit>
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
            {t('My profile')}
          </Menu.Item>
          <Menu.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ marginRight: 16, display: 'inline-block' }}>
                {t('Change role')}
              </span>
              <Select
                className={'roles-select'}
                bordered={false}
                style={{ minWidth: 100 }}
                size={'small'}
                defaultValue={'admin'}
                disabled
                options={[
                  { label: t('Super admin'), value: 'admin' },
                  { label: '数据管理员', value: 'editor' },
                  { label: '普通成员', value: 'member' },
                ]}
              />
            </div>
          </Menu.Item>
          <Menu.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ marginRight: 16, display: 'inline-block' }}>
                {t('Language setting')}
              </span>
              <Select
                className={'roles-select'}
                bordered={false}
                size={'small'}
                defaultValue={i18n.language}
                onChange={async (value) => {
                  await i18n.changeLanguage(value);
                  window.location.reload();
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
            {t('Logout')}
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
