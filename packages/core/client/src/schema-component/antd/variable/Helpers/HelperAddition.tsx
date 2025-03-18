/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import React from 'react';
import { useApp } from '../../../../application';
import { useCompile } from '../../../hooks';
import { addHelper } from './observables';

export function HelperAddition() {
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
            addHelper({ name: key });
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
