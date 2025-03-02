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
import { FormLayout } from '@formily/antd-v5';
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
  const [actFilterId, setActFilterId] = useState(null);
  return (
    <>
      {filters.map((filter, index) => {
        const filterConfig = variableFilters.find((f) => f.name === filter.name);
        if (!filterConfig) {
          return null;
        }
        const schema = {
          'x-uid': uid(),
          type: 'void',
          'x-decorator': 'Form',
          properties: {
            ...Object.fromEntries(
              filterConfig.paramSchema.map((param) => [
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
          <Popover
            key={index}
            content={
              <FormLayout layout={'horizontal'} labelAlign={'left'} labelCol={8} wrapperCol={16}>
                <SchemaComponent schema={schema} />
              </FormLayout>
            }
            trigger={'click'}
            open={actFilterId === index}
          >
            <div
              onMouseEnter={() => {
                setActFilterId(index);
              }}
              style={{ color: '#52c41a', display: 'inline-block' }}
            >
              {' | '} {filterConfig.label}
            </div>
          </Popover>
        );
      })}
    </>
  );
}
