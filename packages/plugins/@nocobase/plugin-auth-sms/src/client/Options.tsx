/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useAuthTranslation } from './locale';

export const Options = () => {
  const { t } = useAuthTranslation();
  return (
    <SchemaComponent
      scope={{ t }}
      schema={{
        type: 'object',
        properties: {
          sms: {
            type: 'void',
            properties: {
              public: {
                type: 'object',
                properties: {
                  verifier: {
                    type: 'string',
                    'x-component': 'VerifierSelect',
                    'x-component-props': {
                      title: '{{t("Verifier")}}',
                      scene: 'auth-sms',
                    },
                  },
                  autoSignup: {
                    'x-decorator': 'FormItem',
                    type: 'boolean',
                    title: '{{t("Sign up automatically when the user does not exist")}}',
                    'x-component': 'Checkbox',
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
