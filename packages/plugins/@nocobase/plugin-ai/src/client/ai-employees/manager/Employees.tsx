/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useContext, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar as AntdAvatar,
  Input,
  Space,
  Button,
  Tabs,
  App,
  Spin,
  Empty,
  Typography,
  Tag,
} from 'antd';
import {
  CollectionRecordProvider,
  ExtendCollectionsProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useCollection,
  useCollectionRecordData,
  useDataBlockRequest,
  useDataBlockResource,
  useRequest,
  useToken,
} from '@nocobase/client';
import { useT } from '../../locale';
const { Meta } = Card;
import { css } from '@emotion/css';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useForm, useField } from '@formily/react';
import { createForm, Field } from '@formily/core';
import { uid } from '@formily/shared';
import { avatars } from '../avatars';
import { ModelSettings } from './ModelSettings';
import { ProfileSettings } from './ProfileSettings';
import { ChatSettings } from './ChatSettings';
import { AIEmployee } from '../types';
import aiEmployees from '../../../collections/ai-employees';
import { useAIEmployeesContext } from '../AIEmployeesProvider';

const EmployeeContext = createContext(null);

const AIEmployeeForm: React.FC<{
  edit?: boolean;
}> = ({ edit }) => {
  return (
    <Tabs
      items={[
        {
          key: 'profile',
          label: 'Profile',
          children: <ProfileSettings edit={edit} />,
          forceRender: true,
        },
        // {
        //   key: 'chat',
        //   label: 'Chat settings',
        //   children: <ChatSettings />,
        // },
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
          forceRender: true,
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
  const { refresh } = useDataBlockRequest();
  const {
    service: { refresh: refreshAIEmployees },
  } = useAIEmployeesContext();
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
      refreshAIEmployees();
    },
  };
};

const useEditActionProps = () => {
  const { setVisible } = useActionContext();
  const { message } = App.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  const { refresh } = useDataBlockRequest();
  const {
    service: { refresh: refreshAIEmployees },
  } = useAIEmployeesContext();
  const collection = useCollection();
  const filterTk = collection.getFilterTargetKey();
  const t = useT();

  return {
    type: 'primary',
    async onClick() {
      await form.submit();
      const values = form.values;
      await resource.update({
        values,
        filterByTk: values[filterTk],
      });
      refresh();
      message.success(t('Saved successfully'));
      setVisible(false);
      form.reset();
      refreshAIEmployees();
    },
  };
};

// export const Employees: React.FC = () => {
//   const t = useT();
//   const { message, modal } = App.useApp();
//   const { token } = useToken();
//   const api = useAPIClient();
//   const { data, loading, refresh } = useRequest<AIEmployee[]>(() =>
//     api
//       .resource('aiEmployees')
//       .list()
//       .then((res) => res?.data?.data),
//   );
//
//   const del = (username: string) => {
//     modal.confirm({
//       title: t('Delete AI employee'),
//       content: t('Are you sure to delete this employee?'),
//       onOk: async () => {
//         await api.resource('aiEmployees').destroy({
//           filterByTk: username,
//         });
//         message.success(t('Deleted successfully'));
//         refresh();
//       },
//     });
//   };
//
//   return (
//     <EmployeeContext.Provider value={{ refresh }}>
//       <div
//         style={{ marginBottom: token.marginLG }}
//         className={css`
//           justify-content: space-between;
//           display: flex;
//           align-items: center;
//         `}
//       >
//         <div>
//           <Input allowClear placeholder={t('Search')} />
//         </div>
//         <div>
//           <Space>
//             <Button>{t('New from template')}</Button>
//             <SchemaComponent
//               scope={{ useCreateFormProps, useCancelActionProps, useCreateActionProps }}
//               components={{ AIEmployeeForm }}
//               schema={{
//                 type: 'void',
//                 name: uid(),
//                 'x-component': 'Action',
//                 'x-component-props': {
//                   type: 'primary',
//                 },
//                 title: 'New AI employee',
//                 properties: {
//                   drawer: {
//                     type: 'void',
//                     'x-component': 'Action.Drawer',
//                     title: 'New AI employee',
//                     'x-decorator': 'FormV2',
//                     'x-use-decorator-props': 'useCreateFormProps',
//                     properties: {
//                       form: {
//                         type: 'void',
//                         'x-component': 'AIEmployeeForm',
//                       },
//                       footer: {
//                         type: 'void',
//                         'x-component': 'Action.Drawer.Footer',
//                         properties: {
//                           close: {
//                             title: 'Cancel',
//                             'x-component': 'Action',
//                             'x-component-props': {
//                               type: 'default',
//                             },
//                             'x-use-component-props': 'useCancelActionProps',
//                           },
//                           submit: {
//                             title: 'Submit',
//                             'x-component': 'Action',
//                             'x-component-props': {
//                               type: 'primary',
//                             },
//                             'x-use-component-props': 'useCreateActionProps',
//                           },
//                         },
//                       },
//                     },
//                   },
//                 },
//               }}
//             />
//           </Space>
//         </div>
//       </div>
//       {loading ? (
//         <Spin />
//       ) : data && data.length ? (
//         <Row gutter={[16, 16]}>
//           {data.map((employee) => (
//             <CollectionRecordProvider key={employee.username} record={employee}>
//               <Col span={6}>
//                 <Card
//                   variant="borderless"
//                   actions={[
//                     <SchemaComponent
//                       key="edit"
//                       scope={{ useCancelActionProps, useEditFormProps, useEditActionProps }}
//                       components={{ AIEmployeeForm }}
//                       schema={{
//                         type: 'void',
//                         name: uid(),
//                         'x-component': 'Action',
//                         'x-component-props': {
//                           component: (props) => <EditOutlined {...props} />,
//                         },
//                         properties: {
//                           drawer: {
//                             type: 'void',
//                             'x-component': 'Action.Drawer',
//                             title: 'Edit AI employee',
//                             'x-decorator': 'FormV2',
//                             'x-use-decorator-props': 'useEditFormProps',
//                             properties: {
//                               form: {
//                                 type: 'void',
//                                 'x-component': 'AIEmployeeForm',
//                                 'x-component-props': {
//                                   edit: true,
//                                 },
//                               },
//                               footer: {
//                                 type: 'void',
//                                 'x-component': 'Action.Drawer.Footer',
//                                 properties: {
//                                   close: {
//                                     title: 'Cancel',
//                                     'x-component': 'Action',
//                                     'x-component-props': {
//                                       type: 'default',
//                                     },
//                                     'x-use-component-props': 'useCancelActionProps',
//                                   },
//                                   submit: {
//                                     title: 'Submit',
//                                     'x-component': 'Action',
//                                     'x-component-props': {
//                                       type: 'primary',
//                                     },
//                                     'x-use-component-props': 'useEditActionProps',
//                                   },
//                                 },
//                               },
//                             },
//                           },
//                         },
//                       }}
//                     />,
//                     <DeleteOutlined key="delete" onClick={() => del(employee.username)} />,
//                   ]}
//                 >
//                   <Meta
//                     avatar={employee.avatar ? <Avatar size={40} src={avatars(employee.avatar)} /> : null}
//                     title={employee.nickname}
//                     description={
//                       <>
//                         {employee.position && (
//                           <Tag
//                             style={{
//                               marginBottom: token.marginXS,
//                             }}
//                           >
//                             {employee.position}
//                           </Tag>
//                         )}
//                         <Typography.Paragraph
//                           style={{ height: token.fontSize * token.lineHeight * 3 }}
//                           ellipsis={{ rows: 3 }}
//                           type="secondary"
//                         >
//                           {employee.bio}
//                         </Typography.Paragraph>
//                       </>
//                     }
//                   />
//                 </Card>
//               </Col>
//             </CollectionRecordProvider>
//           ))}
//         </Row>
//       ) : (
//         <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
//       )}
//     </EmployeeContext.Provider>
//   );
// };

const Avatar: React.FC = (props) => {
  const field = useField<Field>();
  if (!field.value) {
    return null;
  }
  return <AntdAvatar {...props} src={avatars(field.value)} />;
};

export const Employees = () => {
  const t = useT();
  return (
    <ExtendCollectionsProvider collections={[aiEmployees]}>
      <SchemaComponent
        components={{ AIEmployeeForm, Avatar }}
        scope={{
          useCreateFormProps,
          useEditFormProps,
          useCancelActionProps,
          useCreateActionProps,
          useEditActionProps,
        }}
        schema={{
          type: 'void',
          name: 'root',
          properties: {
            block: {
              type: 'void',
              'x-component': 'CardItem',
              'x-component-props': {
                heightMode: 'fullHeight',
              },
              'x-decorator': 'TableBlockProvider',
              'x-decorator-props': {
                collection: 'aiEmployees',
                action: 'list',
                rowKey: 'username',
                dragSort: true,
                dragSortBy: 'sort',
              },
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'ActionBar',
                  'x-component-props': {
                    style: {
                      marginBottom: 20,
                    },
                  },
                  properties: {
                    refresh: {
                      title: "{{t('Refresh')}}",
                      'x-component': 'Action',
                      'x-use-component-props': 'useRefreshActionProps',
                      'x-component-props': {
                        icon: 'ReloadOutlined',
                      },
                    },
                    add: {
                      type: 'void',
                      title: "{{t('New AI employee')}}",
                      'x-align': 'right',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        icon: 'PlusOutlined',
                      },
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
                    },
                  },
                },
                table: {
                  type: 'array',
                  'x-component': 'TableV2',
                  'x-use-component-props': 'useTableBlockProps',
                  'x-component-props': {
                    rowKey: 'username',
                    rowSelection: {
                      type: 'checkbox',
                    },
                  },
                  properties: {
                    column0: {
                      type: 'void',
                      title: t('Avatar'),
                      'x-component': 'TableV2.Column',
                      properties: {
                        avatar: {
                          type: 'string',
                          'x-component': 'Avatar',
                        },
                      },
                    },
                    column1: {
                      type: 'void',
                      title: t('Username'),
                      'x-component': 'TableV2.Column',
                      properties: {
                        username: {
                          type: 'string',
                          'x-component': 'Input',
                          'x-pattern': 'readPretty',
                        },
                      },
                    },
                    column2: {
                      type: 'void',
                      title: t('Nickname'),
                      'x-component': 'TableV2.Column',
                      properties: {
                        nickname: {
                          type: 'string',
                          'x-component': 'Input',
                          'x-pattern': 'readPretty',
                        },
                      },
                    },
                    column3: {
                      type: 'void',
                      title: t('Position'),
                      'x-component': 'TableV2.Column',
                      properties: {
                        position: {
                          type: 'string',
                          'x-component': 'Input',
                          'x-pattern': 'readPretty',
                        },
                      },
                    },
                    column4: {
                      type: 'void',
                      title: t('Bio'),
                      'x-component': 'TableV2.Column',
                      properties: {
                        bio: {
                          type: 'string',
                          'x-component': 'Input.TextArea',
                          'x-component-props': {
                            ellipsis: true,
                          },
                          'x-pattern': 'readPretty',
                        },
                      },
                    },
                    column5: {
                      type: 'void',
                      title: 'Actions',
                      'x-decorator': 'TableV2.Column.ActionBar',
                      'x-component': 'TableV2.Column',
                      properties: {
                        actions: {
                          type: 'void',
                          'x-component': 'Space',
                          'x-component-props': {
                            split: '|',
                          },
                          properties: {
                            edit: {
                              type: 'void',
                              title: 'Edit',
                              'x-action': 'update',
                              'x-component': 'Action.Link',
                              'x-component-props': {
                                openMode: 'drawer',
                              },
                              properties: {
                                drawer: {
                                  type: 'void',
                                  title: t('Edit AI employee'),
                                  'x-component': 'Action.Drawer',
                                  'x-decorator': 'FormV2',
                                  'x-use-decorator-props': 'useEditFormProps',
                                  properties: {
                                    form: {
                                      type: 'void',
                                      'x-component': 'AIEmployeeForm',
                                      'x-component-props': {
                                        edit: true,
                                      },
                                    },
                                    footer: {
                                      type: 'void',
                                      'x-component': 'Action.Drawer.Footer',
                                      properties: {
                                        close: {
                                          title: t('Cancel'),
                                          'x-component': 'Action',
                                          'x-use-component-props': 'useCancelActionProps',
                                        },
                                        submit: {
                                          title: 'Submit',
                                          'x-component': 'Action',
                                          'x-use-component-props': 'useEditActionProps',
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                            destroy: {
                              type: 'void',
                              title: '{{ t("Delete") }}',
                              'x-action': 'destroy',
                              'x-component': 'Action.Link',
                              'x-use-component-props': 'useDestroyActionProps',
                              'x-component-props': {
                                confirm: {
                                  title: "{{t('Delete AI employee')}}",
                                  content: "{{t('Are you sure you want to delete this AI employee?')}}",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }}
      />
    </ExtendCollectionsProvider>
  );
};
