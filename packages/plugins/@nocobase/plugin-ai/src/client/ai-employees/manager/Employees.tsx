/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { Card, Row, Col, Avatar, Input, Space, Button, Tabs, App, Spin, Empty, Typography } from 'antd';
import {
  CollectionRecordProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useCollectionRecordData,
  useRequest,
  useToken,
} from '@nocobase/client';
import { useT } from '../../locale';
const { Meta } = Card;
import { css } from '@emotion/css';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { createForm } from '@formily/core';
import { uid } from '@formily/shared';
import { avatars } from '../avatars';
import { ModelSettings } from './ModelSettings';
import { ProfileSettings } from './ProfileSettings';
import { ChatSettings } from './ChatSettings';

const EmployeeContext = createContext(null);

const AIEmployeeForm: React.FC = () => {
  return (
    <Tabs
      items={[
        {
          key: 'profile',
          label: 'Profile',
          children: <ProfileSettings />,
        },
        {
          key: 'chat',
          label: 'Chat settings',
          children: <ChatSettings />,
        },
        // {
        //   key: 'skills',
        //   label: 'Skills',
        //   // children: (
        //   //   <>
        //   //     <List
        //   //       itemLayout="vertical"
        //   //       size="small"
        //   //       dataSource={[
        //   //         {
        //   //           title: 'Customer Background Lookup',
        //   //           type: 'API request',
        //   //           color: 'green',
        //   //           description:
        //   //             'Retrieves customer data from CRM systems, social media, and public databases to build a comprehensive customer profile.',
        //   //         },
        //   //         {
        //   //           title: 'Sentiment Analysis Engine',
        //   //           type: 'Script execution',
        //   //           color: 'blue',
        //   //           description:
        //   //             'Analyzes customer interactions (emails, chats, calls) to detect sentiment and engagement levels.',
        //   //         },
        //   //         {
        //   //           title: 'Lead Qualification Scoring',
        //   //           type: 'SQL execution',
        //   //           color: 'purple',
        //   //           description:
        //   //             'Queries customer interaction history and purchase data to assign a lead score based on engagement and potential conversion.',
        //   //         },
        //   //         {
        //   //           title: 'Profile Enrichment Workflow',
        //   //           type: 'Call workflows',
        //   //           color: 'orange',
        //   //           description:
        //   //             'Automates the process of merging customer data from multiple sources to enhance and complete missing profile details.',
        //   //         },
        //   //       ]}
        //   //       renderItem={(item) => (
        //   //         <List.Item key={item.title} extra={<RightOutlined />}>
        //   //           <List.Item.Meta
        //   //             // avatar={<Avatar src={item.avatar} />}
        //   //             title={item.title}
        //   //             description={<Tag color={item.color}>{item.type}</Tag>}
        //   //           />
        //   //           {item.description}
        //   //         </List.Item>
        //   //       )}
        //   //     />
        //   //     <Dropdown
        //   //       menu={{
        //   //         items: [
        //   //           {
        //   //             key: 'workflow',
        //   //             label: 'Call workflows',
        //   //           },
        //   //           {
        //   //             key: 'sql',
        //   //             label: 'SQL execution',
        //   //           },
        //   //           {
        //   //             key: 'api',
        //   //             label: 'API request',
        //   //           },
        //   //           {
        //   //             key: 'script',
        //   //             label: 'Script execution',
        //   //           },
        //   //         ],
        //   //       }}
        //   //       placement="bottomLeft"
        //   //     >
        //   //       <Button type="primary" icon={<PlusOutlined />}>
        //   //         Add
        //   //       </Button>
        //   //     </Dropdown>
        //   //   </>
        //   // ),
        // },
        {
          key: 'modelSettings',
          label: 'Model Settings',
          children: <ModelSettings />,
        },
      ]}
    />
  );
};

const useCreateFormProps = () => {
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          username: `${uid()}`,
        },
      }),
    [],
  );
  return {
    form,
  };
};

const useEditFormProps = () => {
  const record = useCollectionRecordData();
  const form = useMemo(
    () =>
      createForm({
        initialValues: record,
      }),
    [record],
  );
  return {
    form,
  };
};

const useCancelActionProps = () => {
  const { setVisible } = useActionContext();
  const form = useForm();
  return {
    type: 'default',
    onClick() {
      setVisible(false);
      form.reset();
    },
  };
};

const useCreateActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const api = useAPIClient();
  const { refresh } = useContext(EmployeeContext);
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await api.resource('aiEmployees').create({
        values,
      });
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
    },
  };
};

const useEditActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const t = useT();
  const { refresh } = useContext(EmployeeContext);
  const api = useAPIClient();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await api.resource('aiEmployees').update({
        values,
        filterByTk: values.username,
      });
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
    },
  };
};

export const Employees: React.FC = () => {
  const t = useT();
  const { message, modal } = App.useApp();
  const { token } = useToken();
  const api = useAPIClient();
  const { data, loading, refresh } = useRequest<
    {
      username: string;
      nickname: string;
      bio: string;
      avatar: string;
    }[]
  >(() =>
    api
      .resource('aiEmployees')
      .list()
      .then((res) => res?.data?.data),
  );

  const del = (username: string) => {
    modal.confirm({
      title: t('Delete AI employee'),
      content: t('Are you sure to delete this employee?'),
      onOk: async () => {
        await api.resource('aiEmployees').destroy({
          filterByTk: username,
        });
        message.success(t('Deleted successfully'));
        refresh();
      },
    });
  };

  return (
    <EmployeeContext.Provider value={{ refresh }}>
      <div
        style={{ marginBottom: token.marginLG }}
        className={css`
          justify-content: space-between;
          display: flex;
          align-items: center;
        `}
      >
        <div>
          <Input allowClear placeholder={t('Search')} />
        </div>
        <div>
          <Space>
            <Button>{t('New from template')}</Button>
            <SchemaComponent
              scope={{ useCreateFormProps, useCancelActionProps, useCreateActionProps }}
              components={{ AIEmployeeForm }}
              schema={{
                type: 'void',
                name: uid(),
                'x-component': 'Action',
                'x-component-props': {
                  type: 'primary',
                },
                title: 'New AI employee',
                properties: {
                  drawer: {
                    type: 'void',
                    'x-component': 'Action.Drawer',
                    title: 'New AI employee',
                    'x-decorator': 'FormV2',
                    'x-use-decorator-props': 'useCreateFormProps',
                    properties: {
                      form: {
                        type: 'void',
                        'x-component': 'AIEmployeeForm',
                      },
                      footer: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: {
                          close: {
                            title: 'Cancel',
                            'x-component': 'Action',
                            'x-component-props': {
                              type: 'default',
                            },
                            'x-use-component-props': 'useCancelActionProps',
                          },
                          submit: {
                            title: 'Submit',
                            'x-component': 'Action',
                            'x-component-props': {
                              type: 'primary',
                            },
                            'x-use-component-props': 'useCreateActionProps',
                          },
                        },
                      },
                    },
                  },
                },
              }}
            />
          </Space>
        </div>
      </div>
      {loading ? (
        <Spin />
      ) : data && data.length ? (
        <Row gutter={[16, 16]}>
          {data.map((employee) => (
            <CollectionRecordProvider key={employee.username} record={employee}>
              <Col span={6}>
                <Card
                  variant="borderless"
                  actions={[
                    <SchemaComponent
                      key="edit"
                      scope={{ useCancelActionProps, useEditFormProps, useEditActionProps }}
                      components={{ AIEmployeeForm }}
                      schema={{
                        type: 'void',
                        name: uid(),
                        'x-component': 'Action',
                        'x-component-props': {
                          component: (props) => <EditOutlined {...props} />,
                        },
                        properties: {
                          drawer: {
                            type: 'void',
                            'x-component': 'Action.Drawer',
                            title: 'Edit AI employee',
                            'x-decorator': 'FormV2',
                            'x-use-decorator-props': 'useEditFormProps',
                            properties: {
                              form: {
                                type: 'void',
                                'x-component': 'AIEmployeeForm',
                              },
                              footer: {
                                type: 'void',
                                'x-component': 'Action.Drawer.Footer',
                                properties: {
                                  close: {
                                    title: 'Cancel',
                                    'x-component': 'Action',
                                    'x-component-props': {
                                      type: 'default',
                                    },
                                    'x-use-component-props': 'useCancelActionProps',
                                  },
                                  submit: {
                                    title: 'Submit',
                                    'x-component': 'Action',
                                    'x-component-props': {
                                      type: 'primary',
                                    },
                                    'x-use-component-props': 'useEditActionProps',
                                  },
                                },
                              },
                            },
                          },
                        },
                      }}
                    />,
                    <DeleteOutlined key="delete" onClick={() => del(employee.username)} />,
                  ]}
                >
                  <Meta
                    avatar={employee.avatar ? <Avatar src={avatars(employee.avatar)} /> : null}
                    title={employee.nickname}
                    description={
                      <Typography.Paragraph
                        style={{ height: token.fontSize * token.lineHeight * 3 }}
                        ellipsis={{ rows: 3 }}
                        type="secondary"
                      >
                        {employee.bio}
                      </Typography.Paragraph>
                    }
                  />
                </Card>
              </Col>
            </CollectionRecordProvider>
          ))}
        </Row>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </EmployeeContext.Provider>
  );
};
