/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useParams, useLocation } from 'react-router-dom';

export const useShortcuts = () => {
  const { name } = useParams();
  const { pathname } = useLocation();
  if (pathname === '/admin/settings/data-source-manager/main/collections') {
    return {
      uid: 'data-modeling',
      builtIn: true,
      shortcuts: [
        {
          uid: 'orin',
          use: 'AIEmployeeShortcutModel',
          props: {
            aiEmployee: {
              username: 'orin',
            },
          },
        },
      ],
    };
  }
  if (name === '0krytmcef9g') {
    return {
      uid: name,
      shortcuts: [
        {
          uid: 'form_assistant',
          use: 'AIEmployeeShortcutModel',
          props: {
            aiEmployee: {
              username: 'form_assistant',
            },
            tasks: [
              {
                message: {
                  workContext: [
                    {
                      type: 'flow-model',
                      uid: 'e3b85ce6e70',
                      title: 'Form(Add new): Users',
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };
  }
  return {
    uid: name,
    builtIn: true,
    shortcuts: [],
  };
};
