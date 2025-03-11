/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useMemo, useContext } from 'react';
import { Dropdown, Popover } from 'antd';
import { createForm } from '@formily/core';
import { useForm, FormContext } from '@formily/react';
import { FilterOutlined } from '@ant-design/icons';
import { uid, tval } from '@nocobase/utils/client';
import type { MenuProps } from 'antd';
import { SchemaComponent } from '../../core/SchemaComponent';
import { useApp } from '../../../application';
import { useCompile } from '../../hooks';
import { useVariable } from './VariableProvider';

export function Addition({ variable, onFilterAdd }) {
  const app = useApp();
  const compile = useCompile();
  const filterOptions = app.jsonTemplateParser.filterGroups
    .sort((a, b) => a.sort - b.sort)
    .map((group) => ({
      key: group.name,
      label: compile(group.title),
      children: group.filters
        .sort((a, b) => a.sort - b.sort)
        .map((filter) => ({ key: filter.name, label: compile(filter.title) })),
    })) as MenuProps['items'];
  return (
    <>
      <span style={{ color: '#bfbfbf', margin: '0 5px' }}>|</span>
      <Dropdown
        menu={{
          items: filterOptions,
          onClick: ({ key }) => {
            onFilterAdd(key);
          },
        }}
      >
        <a onClick={(e) => e.preventDefault()}>
          <FilterOutlined style={{ color: '#52c41a' }} />
        </a>
      </Dropdown>
    </>
  );
}

export function Filters({ filters, onFilterChange }) {
  const app = useApp();
  const variableFilters = app.jsonTemplateParser.filters;
  return (
    <>
      {filters.map((filter, index) => {
        const filterConfig = variableFilters.find((f) => f.name === filter.name);
        if (!filterConfig) {
          return null;
        }
        const previousFilters = filters.slice(0, index);
        return (
          <Filter
            key={index}
            filterId={index}
            config={filterConfig}
            filter={filter}
            previousFilters={previousFilters}
          />
        );
      })}
    </>
  );
}

export function Filter({ config, filter, filterId, previousFilters }) {
  const [open, setOpen] = useState(false);
  const { value } = useVariable();
  const inputValue = [...previousFilters].reduce((value, filter) => {
    return filter.handler(value, ...filter.args);
  }, value);
  const outputValue = [...previousFilters, filter].reduce((value, filter) => {
    return filter.handler(value, ...filter.args);
  }, value);
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const form = useMemo(() => {
    const argsMap = config.uiSchema
      ? Object.fromEntries(config.uiSchema.map((param, index) => [param.name, filter.args[index]]))
      : {};
    return createForm({ initialValues: argsMap });
  }, [config.uiSchema, filter.args]);

  const useSaveActionProps = () => {
    const form = useForm();
    const { updateFilterParams } = useContext(FilterContext);
    return {
      type: 'primary',
      onClick: async () => {
        await form.submit();
        const values = form.values;
        const params = config.uiSchema.map((param) => values[param.name]);
        updateFilterParams({ filterId, params });
        setOpen(false);
      },
    };
  };

  const useDeleteActionProps = () => {
    const form = useForm();
    const { deleteFilter } = useContext(FilterContext);
    return {
      type: 'primary',
      danger: true,
      onClick: async () => {
        deleteFilter({ filterId });
        setOpen(false);
      },
    };
  };
  const argsMap = config.uiSchema
    ? Object.fromEntries(config.uiSchema.map((param, index) => [param.name, filter.args[index]]))
    : {};

  const useFormBlockProps = () => {
    return { form: createForm({ initialValues: argsMap }), layout: 'vertical' };
  };

  const schema = {
    'x-uid': uid(),
    type: 'void',
    'x-component': 'CardItem',
    properties: {
      form: {
        'x-uid': uid(),
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useFormBlockProps',
        properties: {
          '$input-value': {
            type: 'void',
            'x-component': 'Input',
            'x-component-props': {
              defaultValue: '{{ inputValue }}',
              disabled: true,
            },
            'x-decorator': 'FormItem',
            title: tval('Input Value'),
            'x-read-pretty': true,
          },
          ...Object.fromEntries(
            config.uiSchema.map((param) => [
              param.name,
              {
                ...param,
                'x-decorator': 'FormItem',
              },
            ]),
          ),
          '$return-value': {
            type: 'void',
            'x-component': 'Input',
            'x-component-props': {
              defaultValue: '{{ outputValue }}',
              disabled: true,
            },
            'x-decorator': 'FormItem',
            title: tval('Return Value'),
            'x-read-pretty': true,
          },
          actions: {
            type: 'void',
            title: tval('Save'),
            'x-component': 'ActionBar',
            properties: {
              delete: {
                type: 'void',
                title: tval('Delete'),
                'x-component': 'Action',
                'x-use-component-props': 'useDeleteActionProps',
              },
              save: {
                type: 'void',
                title: tval('Save'),
                'x-component': 'Action',
                'x-use-component-props': 'useSaveActionProps',
              },
            },
          },
        },
      },
    },
  };
  const Content = (
    <SchemaComponent
      schema={schema}
      scope={{ useSaveActionProps, useFormBlockProps, useDeleteActionProps, outputValue, inputValue }}
      basePath={['']}
    />
  );

  const WithPropOver = ({ children }) => {
    const { value } = useVariable();

    return (
      <Popover open={open} onOpenChange={handleOpenChange} content={Content} trigger={'click'}>
        {children}
      </Popover>
    );
  };
  const Label = <div style={{ color: '#52c41a', display: 'inline-block', cursor: 'pointer' }}>{config.title}</div>;
  return (
    <>
      <span style={{ color: '#bfbfbf', margin: '0 5px' }}>|</span>
      {config.uiSchema ? <WithPropOver>{Label}</WithPropOver> : Label}
    </>
  );
}

type FilterContextType = {
  variableName: string;
  updateFilterParams: (args: { filterId: number; params: any[] }) => any;
  deleteFilter: (args: { filterId: number }) => any;
};

export const FilterContext = React.createContext<FilterContextType>({
  variableName: '',
  updateFilterParams: (params: any) => {},
  deleteFilter: (params: any) => {},
});
