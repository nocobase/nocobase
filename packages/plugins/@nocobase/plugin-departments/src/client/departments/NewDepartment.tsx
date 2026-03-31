/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useDepartmentTranslation } from '../locale';

export const NewDepartment: React.FC = () => {
  const { t } = useDepartmentTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'void',
        properties: {
          newDepartment: {
            type: 'void',
            title: t('New department'),
            'x-component': 'Action',
            'x-component-props': {
              type: 'text',
              icon: 'PlusOutlined',
              style: {
                width: '100%',
                textAlign: 'left',
              },
            },
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                'x-decorator': 'Form',
                title: t('New department'),
                properties: {
                  title: {
                    'x-component': 'CollectionField',
                    'x-decorator': 'FormItem',
                    required: true,
                  },
                  parent: {
                    'x-component': 'CollectionField',
                    'x-decorator': 'FormItem',
                    'x-collection-field': 'departments.parent',
                    'x-component-props': {
                      component: 'DepartmentSelect',
                    },
                  },
                  roles: {
                    'x-component': 'CollectionField',
                    'x-decorator': 'FormItem',
                    'x-collection-field': 'departments.roles',
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
                          useAction: '{{ useCreateDepartment }}',
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
