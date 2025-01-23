/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field, ObjectField, observer, useField } from '@formily/react';
import { Button, Input, Space } from 'antd';
import React from 'react';
import { ArrayField as ArrayFieldModel } from '@formily/core';
import { CloseCircleOutlined } from '@ant-design/icons';

const ActionParams = observer((props: any) => {
  return (
    <Space>
      <Field name="name" component={[Input]} />
      <span>等于</span>
      <Field name="value" component={[Input]} />
      {!props.disabled && (
        <a role="button" aria-label="icon-close">
          <CloseCircleOutlined onClick={props.onRemove} style={{ color: '#bfbfbf' }} />
        </a>
      )}
    </Space>
  );
});

export const ActionParamsField = observer((props: { action: string }) => {
  const field = useField<ArrayFieldModel>();
  const { action } = props;
  console.log('ActionParamsField action', props);
  return (
    <Space direction="vertical">
      {field?.value?.map((item, index) => (
        <ObjectField key={index} name={index} component={[ActionParams, { onRemove: () => field.remove(index) }]} />
      ))}
      <Button type="link" onClick={() => field.push({})}>
        添加参数
      </Button>
    </Space>
  );
});
