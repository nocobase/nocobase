/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useControllableValue } from 'ahooks';
import { Card, Space, TreeSelect } from 'antd';
import { IEventFlowModule } from '../index';

export default function EventSelect(props: { modules: IEventFlowModule[]; value: any; onChange: (v: any) => void }) {
  const { modules, onChange } = props;
  const [state, setState] = useControllableValue<Array<any>>(props, {
    defaultValue: undefined,
  });

  let treeData = modules?.map((module) => ({
    value: module.name,
    title: module.title,
    children:
      module?.events?.map((event) => ({
        value: module.name + '.' + event.name,
        title: event.title,
      })) || [],
  }));
  treeData = treeData.filter((item) => item.children.length > 0);

  return (
    <TreeSelect
      value={state}
      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
      placeholder="Please select"
      allowClear
      treeDefaultExpandAll
      onChange={(value) => {
        setState(value);
      }}
      treeData={treeData}
    />
  );
}
