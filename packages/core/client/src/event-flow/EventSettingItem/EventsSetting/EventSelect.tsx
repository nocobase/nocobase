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
import { EventDefinition } from '../../types';

export default function EventSelect(props: {
  definitions: EventDefinition[];
  value: any;
  onChange: (v: any) => void;
  className?: string;
}) {
  const { definitions, className } = props;
  const [state, setState] = useControllableValue<String>(props, {
    defaultValue: undefined,
  });

  let treeData = definitions?.map((module) => ({
    value: module.name,
    title: module.title + ' - ' + module.uid,
    selectable: false,
    children:
      module?.events?.map((event) => ({
        value: module.name + '.' + event.name,
        title: event.title,
      })) || [],
  }));
  treeData = treeData?.filter((item) => item.children.length > 0);

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
      className={className}
    />
  );
}
