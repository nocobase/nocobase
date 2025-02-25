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
import { useForm, useParentForm, FormProvider, useField, FormContext } from '@formily/react';
import { FormLayout, FormButtonGroup, Submit } from '@formily/antd-v5';
import { FilterOutlined } from '@ant-design/icons';
import { uid } from '@nocobase/utils/client';
import { variableFilters } from '@nocobase/json-templates';
import type { MenuProps } from 'antd';
import { SchemaComponent } from '../../core/SchemaComponent';
const categorys = [{ key: 'date', type: 'group', label: 'Date' }];
const filterOptions = categorys.map((category) => ({
  ...category,
  children: variableFilters
    .filter((filter) => filter.category === category.key)
    .map((filter) => ({ key: filter.name, label: filter.label })),
})) as MenuProps['items'];

export function Addition({ variable, onFilterAdd }) {
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
  return (
    <>
      {filters.map((filter, index) => {
        const filterConfig = variableFilters.find((f) => f.name === filter.name);
        if (!filterConfig) {
          return null;
        }
        return <Filter key={index} filterId={index} config={filterConfig} filter={filter} />;
      })}
    </>
  );
}

export function Filter({ config, filter, filterId }) {
  const argsMap = Object.fromEntries(config.paramSchema.map((param, index) => [param.name, filter.args[index]]));
  const form = useMemo(() => createForm({ initialValues: argsMap }), [argsMap]);
  const field = useField();
  const useSaveActionProps = () => {
    const form = useForm();
    const { updateFilterParams } = useContext(FilterContext);
    return {
      type: 'primary',
      onClick: async () => {
        await form.submit();
        const values = form.values;
        const params = config.paramSchema.map((param) => values[param.name]);
        updateFilterParams({ filterId, params });
      },
    };
  };
  const useFormBlockProps = () => {
    return { form };
  };

  const schema = {
    'x-uid': uid(),
    type: 'void',
    // 'x-component': 'FormV2',
    // 'x-use-component-props': 'useFormBlockProps',
    properties: {
      ...Object.fromEntries(
        config.paramSchema.map((param) => [
          param.name,
          {
            ...param,
            'x-decorator': 'FormItem',
          },
        ]),
      ),
      actions: {
        type: 'void',
        title: 'Save',
        'x-component': 'ActionBar',
        properties: {
          save: {
            type: 'void',
            title: 'Save',
            'x-component': 'Action',
            'x-use-component-props': 'useSaveActionProps',
          },
        },
      },
    },
  };
  return (
    <>
      <span style={{ color: '#bfbfbf', margin: '0 5px' }}>|</span>
      <Popover
        content={
          <FormContext.Provider value={form}>
            <SchemaComponent schema={schema} scope={{ useSaveActionProps, useFormBlockProps }} basePath={['']} />
          </FormContext.Provider>
        }
        trigger={'click'}
      >
        <div style={{ color: '#52c41a', display: 'inline-block', cursor: 'pointer' }}>{config.label}</div>
      </Popover>
    </>
  );
}

type FilterContextType = {
  updateFilterParams: (args: { filterId: number; params: any[] }) => any;
};

export const FilterContext = React.createContext<FilterContextType>({
  updateFilterParams: (params: any) => {},
});
