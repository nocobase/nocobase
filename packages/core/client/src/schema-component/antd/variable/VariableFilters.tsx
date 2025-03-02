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
import { FilterOutlined } from '@ant-design/icons';
import { uid } from '@nocobase/utils';
import { variableFilters } from '@nocobase/json-templates';
import type { MenuProps } from 'antd';
import { SchemaComponent } from '../../core';
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
      <Dropdown
        menu={{
          items: filterOptions,
          onClick: ({ key }) => {
            onFilterAdd(key);
          },
        }}
      >
        <a onClick={(e) => e.preventDefault()}>
          <FilterOutlined />
        </a>
      </Dropdown>
    </>
  );
}

export function Filters({ filters, onFilterChange }) {
  const [actFilterName, setActFilterName] = useState(null);
  const actFilter = variableFilters.find((f) => f.name === actFilterName);
  const paramSchema = actFilter?.paramSchema;

  const schema = {
    type: 'void',
    'x-component': 'Form',
    properties: {
      ...Object.fromEntries(paramSchema.map((param) => [param.name, param])),
    },
  };

  const ParamConfig = () => <SchemaComponent schema={schema} />;
  return (
    <>
      {filters.map((filter, index) => {
        const filterConfig = variableFilters.find((f) => f.name === filter.name);
        if (!filterConfig) {
          return null;
        }
        const id = uid();
        return (
          <>
            <span key={id}> | </span>
            <Popover key={id} title={filterConfig.label} content={<SchemaComponent schema={filter.paramSchema} />}>
              <span style={{ color: '#52c41a' }}>{filterConfig.label}</span>
            </Popover>
          </>
        );
      })}
    </>
  );
}
