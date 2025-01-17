/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useControllableValue } from 'ahooks';
import { Card, Form, Space, Button } from 'antd';
import EventSelect from './EventSelect';
import ConditionInput from './ConditionInput';
import ActionsInput from './ActionsInput';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { EventSetting } from '../types';
import { FormLinkageRules } from './LinkageRules';
import { createForm } from '@formily/core';
import options from './options.json';

const EventCard = (props) => {
  const { modules, onDelete } = props;
  const [state, setState] = useControllableValue<any>(props, {
    defaultValue: {
      event: undefined,
      condition: undefined,
      actions: undefined,
    },
  });

  const form = useMemo(
    () =>
      createForm({
        initialValues: { rules: [] },
      }),
    [],
  );

  return (
    <Card size="small" style={{ width: '100%' }} title="事件配置" extra={<CloseOutlined onClick={onDelete} />}>
      <Form.Item label="事件：">
        <EventSelect modules={modules} value={state.event} onChange={(v) => setState({ ...state, event: v })} />
      </Form.Item>
      {/* <Form.Item label="执行条件：">
        <ConditionInput
          modules={modules}
          value={state.condition}
          onChange={(v) => setState({ ...state, condition: v })}
        />
      </Form.Item>
      <Form.Item label="执行动作：">
        <ActionsInput modules={modules} value={state.actions} onChange={(v) => setState({ ...state, actions: v })} />
      </Form.Item> */}
      <FormLinkageRules
        category="default"
        collectionName="t_aierml1wni1"
        elementType="field"
        defaultValues={[]}
        form={form}
        formBlockType="create"
        linkageOptions={[]}
        localVariables={[]}
        options={options}
        variables={{}}
        value={{ rules: [] }}
        record={{
          __collectionName: 't_aierml1wni1',
        }}
      />
    </Card>
  );
};

export default function EventSettings(props) {
  const { modules, value } = props;
  const [state, setState] = useControllableValue<Array<EventSetting | {}>>(props, {
    defaultValue: [],
  });
  const onAdd = () => {
    setState([...state, {}]);
  };
  const onDelete = (index: number) => {
    const newState = [...state];
    newState.splice(index, 1);
    setState(newState);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {Array.from(state).map((item, index) => (
        <EventCard
          key={index}
          value={item}
          modules={modules}
          onChange={(v) => {
            const newState = [...state];
            newState[index] = v;
            setState(newState);
          }}
          onDelete={() => onDelete(index)}
        />
      ))}
      <Button type="primary" size="small" onClick={onAdd}>
        <PlusOutlined />
      </Button>
    </Space>
  );
}
