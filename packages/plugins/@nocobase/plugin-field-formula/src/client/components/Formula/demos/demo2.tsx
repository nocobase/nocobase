/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * title: Formula
 */
import { connect } from '@formily/react';
import { Formula, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';

const Expression = connect(Formula.Expression);

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      default: '{{f1 }} + {{ f2}}',
      'x-component': 'Expression',
      'x-component-props': {
        supports: [
          'checkbox',

          'number',
          'percent',
          'integer',
          'number',
          'percent',

          'input',
          'textarea',
          'email',
          'phone',

          'datetime',
          'createdAt',
          'updatedAt',

          'radioGroup',
          'checkboxGroup',
          'select',
          'multipleSelect',

          // 'json'
        ],
        useCurrentFields: () => {
          return [
            {
              name: 'f1',
              interface: 'number',
              uiSchema: {
                title: 'F1',
              },
            },
            {
              name: 'f2',
              interface: 'number',
              uiSchema: {
                title: 'F2',
              },
            },
          ];
        },
      },
    },
  },
};

export default () => {
  return (
    <SchemaComponentProvider components={{ Expression }}>
      <SchemaComponent schema={schema} />
    </SchemaComponentProvider>
  );
};
