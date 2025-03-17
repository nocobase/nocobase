/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent, useActionContext, useRequest } from '@nocobase/client';
import React from 'react';
import { useACLTranslation } from './locale';
import { uid } from '@formily/shared';

export const NewRole: React.FC = () => {
  const { t } = useACLTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'void',
        properties: {
          newRole: {
            type: 'void',
            title: t('New role'),
            'x-component': 'Action',
            'x-component-props': {
              type: 'text',
              icon: 'PlusOutlined',
              style: {
                textAlign: 'left',
              },
            },
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                'x-decorator': 'Form',
                'x-decorator-props': {
                  useValues(options: any) {
                    const ctx = useActionContext();
                    return useRequest(
                      () =>
                        Promise.resolve({
                          data: {
                            name: `r_${uid()}`,
                            snippets: ['!ui.*', '!pm', '!pm.*'],
                          },
                        }),
                      { ...options, refreshDeps: [ctx.visible] },
                    );
                  },
                },
                title: t('New role'),
                properties: {
                  title: {
                    'x-component': 'CollectionField',
                    'x-decorator': 'FormItem',
                  },
                  name: {
                    'x-component': 'CollectionField',
                    'x-decorator': 'FormItem',
                    description:
                      '{{t("Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.")}}',
                  },
                  default: {
                    'x-component': 'CollectionField',
                    'x-decorator': 'FormItem',
                    title: '',
                    'x-content': '{{t("Default role")}}',
                  },
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Drawer.Footer',
                    properties: {
                      cancel: {
                        title: '{{t("Cancel")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: '{{ cm.useCancelAction }}',
                        },
                      },
                      submit: {
                        title: '{{t("Submit")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          useAction: '{{ cm.useCreateAction }}',
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
  );
};
