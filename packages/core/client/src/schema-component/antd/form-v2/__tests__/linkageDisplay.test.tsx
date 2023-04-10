import '@testing-library/jest-dom';
import React, { useMemo } from 'react';
import { FormItem } from '@formily/antd';
import { createForm } from '@formily/core';
import { render, fireEvent } from '@testing-library/react';
import {
  SchemaComponent,
  SchemaComponentProvider,
  Grid,
  Input,
  FormBlockProvider,
} from '@nocobase/client';
import { Form } from '../Form';

describe('form field displaylinkage', () => {
  it('updates name field disaply when single field value is changed', () => {
    const ComponentA = () => {
      const useFormBlockProps = () => {
        const form = useMemo(() => createForm(), []);
        return {
          form: form,
        };
      };
      const schema: any = {
        type: 'void',
        'x-acl-action-props': { skipScopeCheck: true },
        'x-acl-action': 'tags:create',
        'x-decorator': 'FormBlockProvider',
        'x-decorator-props': { resource: 'tags', collection: 'tags' },
        'x-component': 'CardItem',
        properties: {
          ukypn3nb6bc: {
            type: 'void',
            'x-component': 'Form',
            'x-component-props': {
              useProps: useFormBlockProps,
            },
            properties: {
              grid: {
                type: 'void',
                'x-component': 'Grid',
                'x-linkage-rules': [
                  {
                    condition: { $and: [{ single: { $eq: 'apple' } }] },
                    actions: [
                      {
                        targetFields: ['name'],
                        operator: 'none',
                      },
                    ],
                  },
                ],
                properties: {
                  '18p3c2nodkw': {
                    type: 'void',
                    'x-component': 'Grid.Row',
                    properties: {
                      '3p36izpvy9q': {
                        type: 'void',
                        'x-component': 'Grid.Col',
                        properties: {
                          single: {
                            type: 'string',
                            title: 'single',
                            'x-component': Input,
                            'x-decorator': 'FormItem',
                            'x-component-props': {
                              placeholder: 'single',
                            },
                          },
                        },
                      },
                    },
                  },
                  p4372tmusz2: {
                    type: 'void',
                    'x-component': 'Grid.Row',
                    properties: {
                      xuiwn30smwl: {
                        type: 'void',
                        'x-component': 'Grid.Col',
                        properties: {
                          name: {
                            type: 'string',
                            title: 'name',
                            'x-component': Input,
                            'x-decorator': 'FormItem',
                            'x-component-props': {
                              placeholder: 'name',
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
      };
      return (
        <SchemaComponentProvider scope={{ useFormBlockProps }} components={{ Form, Grid, FormItem, FormBlockProvider }}>
          <SchemaComponent schema={schema} />
        </SchemaComponentProvider>
      );
    };
    const { getAllByPlaceholderText } = render(<ComponentA />);
    const f1 = getAllByPlaceholderText('single')[0];
    expect(getAllByPlaceholderText('name')[0]).toBeInTheDocument();
    fireEvent.input(f1, { target: { value: 'apple' } });
    let f2;
    try {
      f2 = getAllByPlaceholderText('name')[0];
    } catch (error) {
      // 元素不存在
    }
    expect(f2).toBeUndefined();
  });
});
