/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FilterOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import type { MenuProps } from 'antd';
import { Dropdown, Tag } from 'antd';
import React from 'react';
import { useApp } from '../../../../application';
import { useCompile } from '../../../hooks';
import { useHelperObservables } from './hooks/useHelperObservables';
import { allHelpersConfigObs } from './observables';

export const HelperAddition = observer(() => {
  const app = useApp();
  const helperObservables = useHelperObservables();
  const { addHelper } = helperObservables;
  const compile = useCompile();
  const filterOptions = app.jsonTemplateParser.filterGroups
    .sort((a, b) => a.sort - b.sort)
    .map((group) => ({
      key: group.name,
      type: 'group',
      label: compile(group.title),
      children: group.filters
        .sort((a, b) => a.sort - b.sort)
        .map((filter) => ({ key: filter.name, label: compile(filter.title) })),
    })) as MenuProps['items'];

  const items = allHelpersConfigObs.value.map((helper) => ({
    key: helper.name,
    label: helper.title,
  }));

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
});
