import '@testing-library/jest-dom';
import React, { useMemo } from 'react';
import { FormItem } from '@formily/antd';
import { createForm } from '@formily/core';
import { render, fireEvent } from '@testing-library/react';
import { SchemaComponent, SchemaComponentProvider, Grid, Input, FormBlockProvider } from '@nocobase/client';
import { Form } from '../../../../schema-component/antd/form-v2/Form';

describe('form linkage', () => {
  it('updates name field value when single field value is changed', () => {
    const ComponentA = () => {
      const useFormBlockProps = () => {
        const form = useMemo(() => createForm(), []);
        return {
          form: form,
        };
      };
      const schema: any = {
        _isJSONSchemaObject: true,
        version: '2.0',
        type: 'void',
        'x-acl-action-props': { skipScopeCheck: true },
        'x-acl-action': 'tags:create',
        'x-decorator': 'FormBlockProvider',
        'x-decorator-props': { resource: 'tags', collection: 'tags' },
        'x-component': 'CardItem',
        properties: {
          ukypn3nb6bc: {
            _isJSONSchemaObject: true,
            version: '2.0',
            type: 'void',
            'x-component': 'Form',
            'x-component-props': {
              useProps: useFormBlockProps,
            },

            properties: {
              grid: {
                'x-uid': 'be1z5loyi4b',
                _isJSONSchemaObject: true,
                version: '2.0',
                type: 'void',
                'x-component': 'Grid',
                'x-linkage-rules': [
                  {
                    condition: { $and: [{ single: { $eq: 'apple' } }] },
                    actions: [
                      {
                        targetFields: ['name'],
                        operator: 'value',
                        value: { mode: 'constant', value: 'I LIKE IT' },
                      },
                    ],
                  },
                ],
                properties: {
                  '18p3c2nodkw': {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Row',
                    properties: {
                      '3p36izpvy9q': {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Grid.Col',
                        properties: {
                          single: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'string',
                            title: 'single',
                            'x-component': Input,
                            'x-decorator': 'FormItem',
                            'x-component-props': {
                              placeholder: 'single',
                            },
                            'x-uid': 'v5ivwvhzf0h',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'u449wavgegj',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'wge4djatqmf',
                    'x-async': false,
                    'x-index': 1,
                  },
                  p4372tmusz2: {
                    _isJSONSchemaObject: true,
                    version: '2.0',
                    type: 'void',
                    'x-component': 'Grid.Row',
                    properties: {
                      xuiwn30smwl: {
                        _isJSONSchemaObject: true,
                        version: '2.0',
                        type: 'void',
                        'x-component': 'Grid.Col',
                        properties: {
                          name: {
                            _isJSONSchemaObject: true,
                            version: '2.0',
                            type: 'string',
                            title: 'name',
                            'x-component': Input,
                            'x-decorator': 'FormItem',
                            'x-component-props': {
                              placeholder: 'name',
                            },
                            'x-uid': '87092ocxwcn',
                            'x-async': false,
                            'x-index': 1,
                          },
                        },
                        'x-uid': 'zmwq46ex99o',
                        'x-async': false,
                        'x-index': 1,
                      },
                    },
                    'x-uid': 'hn5s91f453z',
                    'x-async': false,
                    'x-index': 2,
                  },
                },
                'x-async': false,
                'x-index': 1,
              },
            },
            'x-uid': 'he9901drbxl',
            'x-async': false,
            'x-index': 1,
          },
        },
        'x-uid': 'mlfyjcsony9',
        'x-async': false,
        'x-index': 1,
      };
      return (
        <SchemaComponentProvider scope={{ useFormBlockProps }} components={{ Form, Grid, FormItem, FormBlockProvider }}>
          <SchemaComponent schema={schema} />
        </SchemaComponentProvider>
      );
    };
    const { getByText, getAllByPlaceholderText, getByTitle, container } = render(<ComponentA />);
    const f1 = getAllByPlaceholderText('single')[0];
    const f2 = getAllByPlaceholderText('name')[0];
    fireEvent.input(f1, { target: { value: 'apple' } });
    expect(f2).toHaveValue('I LIKE IT');
  });
});
