/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
import { Avatar as AntdAvatar, Tabs } from 'antd';
import { ExtendCollectionsProvider, SchemaComponent, useAPIClient } from '@nocobase/client';
import { useT } from '../../locale';
import { useField } from '@formily/react';
import { Field } from '@formily/core';
import { avatars } from '../avatars';
import { ModelSettings } from './ModelSettings';
import { ProfileSettings } from './ProfileSettings';
import aiEmployees from '../../../collections/ai-employees';
import { SkillSettings } from './SkillSettings';
import { DataSourceSettings } from './DataSourceSettings';
import { Templates } from './Templates';
import {
  useCreateFormProps,
  useEditFormProps,
  useCancelActionProps,
  useCreateActionProps,
  useEditActionProps,
} from './hooks';
import { KnowledgeBaseSettings } from './KnowledgeBaseSettings';

const AIEmployeeForm: React.FC<{
  edit?: boolean;
}> = ({ edit }) => {
  const t = useT();
  const api = useAPIClient();
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(false);

  useEffect(() => {
    api
      .resource('aiSettings')
      .isKnowledgeBaseEnabled()
      .then((res) => {
        setKnowledgeBaseEnabled(res?.data?.data.enabled);
      })
      .catch((err) => console.error('api fail aiSettings.isKnowledgeBaseEnabled', err));
  }, [api]);

  return (
    <Tabs
      items={[
        {
          key: 'profile',
          label: t('Profile'),
          children: <ProfileSettings edit={edit} />,
          forceRender: true,
        },
        // {
        //   key: 'chat',
        //   label: 'Chat settings',
        //   children: <ChatSettings />,
        // },
        {
          key: 'modelSettings',
          label: t('Model settings'),
          children: <ModelSettings />,
          forceRender: true,
        },
        {
          key: 'skills',
          label: t('Skills'),
          children: <SkillSettings />,
        },
        // {
        //   key: 'dataSources',
        //   label: t('Data sources'),
        //   children: <DataSourceSettings />,
        // },
        ...(knowledgeBaseEnabled
          ? [
              {
                key: 'knowledgeBase',
                label: t('KnowledgeBase'),
                children: <KnowledgeBaseSettings />,
              },
            ]
          : []),
      ]}
    />
  );
};

const Avatar: React.FC = (props) => {
  const field = useField<Field>();
  if (!field.value) {
    return null;
  }
  return <AntdAvatar shape="square" size="large" {...props} src={avatars(field.value)} />;
};

export const Employees: React.FC = () => {
  const t = useT();
  return (
    <ExtendCollectionsProvider collections={[aiEmployees]}>
      <SchemaComponent
        components={{ AIEmployeeForm, Avatar, Templates }}
        scope={{
          t,
          useCreateFormProps,
          useEditFormProps,
          useCancelActionProps,
          useCreateActionProps,
          useEditActionProps,
        }}
        schema={{
          type: 'void',
          name: 'ai-employees',
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
                    // template: {
                    //   type: 'void',
                    //   title: "{{t('New from template')}}",
                    //   'x-align': 'right',
                    //   'x-component': 'Action',
                    //   'x-component-props': {
                    //     type: 'primary',
                    //     ghost: true,
                    //     icon: 'FileAddOutlined',
                    //   },
                    //   properties: {
                    //     modal: {
                    //       type: 'void',
                    //       'x-component': 'Action.Modal',
                    //       title: "{{t('New from template')}}",
                    //       properties: {
                    //         templates: {
                    //           type: 'void',
                    //           'x-component': 'Templates',
                    //         },
                    //       },
                    //     },
                    //   },
                    // },
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
                          title: '{{t("New AI employee")}}',
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
                                  title: '{{t("Submit")}}',
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
                      title: '{{t("Actions")}}',
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
                              title: '{{t("Edit") }}',
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
                                          title: '{{t("Submit")}}',
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
