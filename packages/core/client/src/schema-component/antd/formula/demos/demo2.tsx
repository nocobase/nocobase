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
        evaluate: (exp, scope) => {
          return 1;
        },
        supports: ['number'],
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
