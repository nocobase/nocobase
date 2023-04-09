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
  InputNumber,
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
                'x-uid': 'be1z5loyi4b',
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
                            'x-uid': 'v5ivwvhzf0h',
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'u449wavgegj',
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'wge4djatqmf',
                    'x-index': 1,
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
                            'x-uid': '87092ocxwcn',
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'zmwq46ex99o',
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'hn5s91f453z',
                    'x-index': 2,
                  },
                },
                'x-index': 1,
              },
            },
            'x-uid': 'he9901drbxl',
            'x-index': 1,
          },
        },
        'x-uid': 'mlfyjcsony9',
        'x-index': 1,
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
