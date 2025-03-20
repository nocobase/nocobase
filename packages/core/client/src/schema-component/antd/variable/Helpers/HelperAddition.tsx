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
import { Dropdown, Tag } from 'antd';
import React from 'react';
import { useHelperObservables } from './hooks/useHelperObservables';
import { allHelpersConfigObs } from './observables';

export const HelperAddition = observer(() => {
  const helperObservables = useHelperObservables();
  const { addHelper } = helperObservables;

  const items = allHelpersConfigObs.value.map((helper) => ({
    key: helper.name,
    label: helper.title,
  }));

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => {
          addHelper({ name: key });
        },
      }}
    >
      <Tag style={{ cursor: 'pointer' }}>
        <FilterOutlined /> Add Filter
      </Tag>
    </Dropdown>
  );
});
