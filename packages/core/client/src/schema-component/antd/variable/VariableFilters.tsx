/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Dropdown, Popover } from 'antd';
import { useForm } from '@formily/react';
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
        return <Filter key={index} config={filterConfig} saveFilterParams={() => {}} />;
      })}
    </>
  );
}
const useSaveActionProps = () => {
  const form = useForm();
  return {
    type: 'primary',
    onClick: async () => {
      await form.submit();
      const values = form.values;
      const format = values.format;
    },
  };
};

export function Filter({ config, saveFilterParams }) {
  const schema = {
    'x-uid': uid(),
    type: 'void',
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
    },
  };
  return (
    <>
      <span style={{ color: '#bfbfbf', margin: '0 5px' }}>|</span>
      <Popover
        content={
          <FormLayout layout={'horizontal'} labelAlign={'left'} labelCol={8} wrapperCol={16}>
            <SchemaComponent schema={schema} scope={{ useSaveActionProps }} />
            <FormButtonGroup.FormItem>
              <Submit>Save</Submit>
            </FormButtonGroup.FormItem>
          </FormLayout>
        }
        trigger={'click'}
      >
        <div style={{ color: '#52c41a', display: 'inline-block', cursor: 'pointer' }}>{config.label}</div>
      </Popover>
    </>
  );
}
