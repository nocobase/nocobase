/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Flex, Form, FormInstance, Input, InputNumber, Switch } from 'antd';
import { FlowModelContext, MultiRecordResource, useFlowContext } from '@nocobase/flow-engine';
import { CollectionCascader } from '../basic';

export const CollectionSetting: React.FC<{
  form: FormInstance;
  onCollectionCascaderChange?: (value: string[] | null) => void;
  name: string;
  show: boolean;
  disableCollectionCascader?: boolean;
}> = ({ form, onCollectionCascaderChange, name, show, disableCollectionCascader }) => {
  const ctx = useFlowContext<FlowModelContext & { resource: MultiRecordResource }>();

  const validateMessages = {
    required: ctx.t('defaults.form.required'),
  };

  return (
    <Form
      form={form}
      name={name}
      initialValues={{
        description: '',
        enabled: true,
        limit: 1000,
      }}
      validateMessages={validateMessages}
      layout="vertical"
      colon={true}
      style={!show && { display: 'none' }}
    >
      <Form.Item
        label={ctx.t('Title')}
        name="title"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={ctx.t('Collection')}
        name="collection"
        rules={[
          {
            required: true,
          },
        ]}
      >
        <CollectionCascader onChange={onCollectionCascaderChange} disabled={disableCollectionCascader === true} />
      </Form.Item>
      <Form.Item label={ctx.t('Description')} name="description">
        <Input.TextArea rows={5} />
      </Form.Item>
      <Flex justify="space-between" align="center">
        <Form.Item
          required={false}
          label={ctx.t('Limit')}
          name="limit"
          rules={[
            {
              required: true,
            },
          ]}
          layout="horizontal"
        >
          <InputNumber min={1} max={20000} step={100} changeOnWheel />
        </Form.Item>
        <Form.Item
          required={false}
          label={ctx.t('Enabled')}
          name="enabled"
          rules={[
            {
              required: true,
            },
          ]}
          layout="horizontal"
        >
          <Switch />
        </Form.Item>
      </Flex>
    </Form>
  );
};
