import { AntdSchemaComponentProvider, Input, SchemaComponent, SchemaComponentProvider } from '@nocobase/client';
import React from 'react';
import { Filter } from '../Filter';
import { render, screen, fireEvent, act } from '@testing-library/react';

const schema: any = {
  type: 'void',
  properties: {
    demo: {
      name: 'filter',
      type: 'object',
      enum: [
        {
          name: 'name',
          title: 'Name',
          operators: [
            { label: 'eq', value: '$eq' },
            { label: 'ne', value: '$ne' },
          ],
          schema: {
            type: 'string',
            title: 'Name',
            'x-component': 'Input',
          },
        },
        {
          name: 'age',
          title: 'Age',
          operators: [
            { label: 'in', value: '$in' },
            { label: 'not', value: '$not' },
          ],
          schema: {
            type: 'string',
            title: 'Age',
            'x-component': 'InputNumber',
          },
        },
        {
          name: 'tags',
          title: 'Tags',
          schema: {
            title: 'Tags',
          },
          children: [
            {
              name: 'slug',
              title: 'Slug',
              operators: [
                { label: 'in', value: '$in' },
                { label: 'not', value: '$not' },
              ],
              schema: {
                title: 'Slug',
                type: 'string',
                'x-component': 'Input',
              },
            },
            {
              name: 'title',
              title: 'Title',
              operators: [
                { label: 'eq', value: '$eq' },
                { label: 'ne', value: '$ne' },
              ],
              schema: {
                title: 'Title',
                type: 'string',
                'x-component': 'Input',
              },
            },
          ],
        },
      ],
      default: {
        $or: [
          {
            name: {
              $ne: null,
            },
          },
          {
            'tags.title': {
              $eq: 'aaa',
            },
          },
        ],
      },
      'x-component': 'Filter',
      'x-component-props': {},
    },
  },
};

const App = () => {
  return (
    <SchemaComponentProvider>
      <AntdSchemaComponentProvider>
        <SchemaComponent components={{ Input, Filter }} schema={schema} />
      </AntdSchemaComponentProvider>
    </SchemaComponentProvider>
  );
};

describe('Filter', () => {
  it('filter add condition', () => {
    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
    const addBtn = screen.getByText('Add condition');
    fireEvent.click(addBtn);
    const selectField = container.getElementsByClassName('ant-select-selection-placeholder')[0];
    expect(selectField.textContent).toBe('Select Field');
  });
});
