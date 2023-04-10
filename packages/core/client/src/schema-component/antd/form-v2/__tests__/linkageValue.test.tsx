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

describe('form field valuelinkage', () => {
  it('updates name field value when single field value is changed', () => {
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
                        operator: 'value',
                        value: { mode: 'constant', value: 'I LIKE IT' },
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
    const f2 = getAllByPlaceholderText('name')[0];
    fireEvent.input(f1, { target: { value: 'apple' } });
    expect(f2).toHaveValue('I LIKE IT');
  });
  it('updates name field value when all condictions are met', () => {
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
                    condition: { $and: [{ single: { $eq: 'apple' } }, { number: { $eq: 888 } }] },
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
                  p455554dswd: {
                    type: 'void',
                    'x-component': 'Grid.Row',
                    properties: {
                      number_link: {
                        type: 'void',
                        'x-component': 'Grid.Col',
                        properties: {
                          number: {
                            type: 'number',
                            'x-component': 'InputNumber',
                            'x-decorator': 'FormItem',
                            'x-component-props': {
                              placeholder: 'number',
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
        <SchemaComponentProvider
          scope={{ useFormBlockProps }}
          components={{ Form, Grid, FormItem, InputNumber, FormBlockProvider }}
        >
          <SchemaComponent schema={schema} />
        </SchemaComponentProvider>
      );
    };
    const { getAllByPlaceholderText, container } = render(<ComponentA />);
    const f1 = getAllByPlaceholderText('single')[0];
    const f2 = getAllByPlaceholderText('number')[0];
    const f3 = getAllByPlaceholderText('name')[0];
    fireEvent.input(f1, { target: { value: 'apple' } });
    expect(f3).toHaveValue('');
    fireEvent.input(f2, { target: { value: 888 } });
    expect(f3).toHaveValue('I LIKE IT');
  });
  it('updates name field value when any condictions are met', () => {
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
                    condition: { $any: [{ single: { $eq: 'apple' } }, { number: { $eq: 888 } }] },
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
                  p455554dswd: {
                    type: 'void',
                    'x-component': 'Grid.Row',
                    properties: {
                      number_link: {
                        type: 'void',
                        'x-component': 'Grid.Col',
                        properties: {
                          number: {
                            type: 'number',
                            'x-component': 'InputNumber',
                            'x-decorator': 'FormItem',
                            'x-component-props': {
                              placeholder: 'number',
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
        <SchemaComponentProvider
          scope={{ useFormBlockProps }}
          components={{ Form, Grid, FormItem, InputNumber, FormBlockProvider }}
        >
          <SchemaComponent schema={schema} />
        </SchemaComponentProvider>
      );
    };
    const { getAllByPlaceholderText } = render(<ComponentA />);
    const f1 = getAllByPlaceholderText('single')[0];
    const f2 = getAllByPlaceholderText('number')[0];
    const f3 = getAllByPlaceholderText('name')[0];
    fireEvent.input(f1, { target: { value: 'apple' } });
    expect(f3).toHaveValue('I LIKE IT');
    fireEvent.input(f3, { target: { value: '' } });
    fireEvent.input(f1, { target: { value: 'orange' } });
    fireEvent.input(f2, { target: { value: 888 } });
    expect(f3).toHaveValue('I LIKE IT');
  });
});
