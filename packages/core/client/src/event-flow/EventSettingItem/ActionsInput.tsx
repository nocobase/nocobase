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
import { Card, Space, Button, Tag, Tooltip, Select, TreeSelect } from 'antd';
import { CloseOutlined, PlusOutlined, SettingFilled } from '@ant-design/icons';
import { EventDefinition } from '../types';

export default function ActionsInput(props: { modules: EventDefinition[]; value: any; onChange: (v: any) => void }) {
  const { modules } = props;
  const [state, setState] = useControllableValue<Array<any>>(props, {
    defaultValue: [],
  });
  const onAdd = () => {
    if (!state) {
      setState([{}]);
    } else {
      setState([...state, {}]);
    }
  };

  const treeData = modules?.map((module) => ({
    value: module.name,
    title: module.title,
    children:
      module?.actions?.map((action) => ({
        value: module.name + '.' + action.name,
        title: action.title,
      })) || [],
  }));

  const onDelete = (index: number) => {
    const newState = [...state];
    newState.splice(index, 1);
    setState(newState);
  };

  return (
    <>
      <Space wrap>
        {state?.map((item, index) => (
          <Card key={index} size="small" style={{ width: '100%' }}>
            <TreeSelect
              value={item}
              dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
              placeholder="Please select"
              allowClear
              treeDefaultExpandAll
              onChange={(value) => {
                const newState = [...state];
                newState[index] = value;
                setState(newState);
              }}
              treeData={treeData}
            />
            <CloseOutlined onClick={() => onDelete(index)} />
          </Card>
        ))}
        <Button type="primary" size="small" onClick={onAdd}>
          <PlusOutlined />
        </Button>
      </Space>
    </>
  );
}
