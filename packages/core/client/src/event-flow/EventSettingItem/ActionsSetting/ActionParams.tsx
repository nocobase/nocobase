/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field, ObjectField, observer, useField, useForm } from '@formily/react';
import { Button, Input, Space } from 'antd';
import React, { useCallback } from 'react';
import { ArrayField as ArrayFieldModel } from '@formily/core';
import { CloseCircleOutlined } from '@ant-design/icons';
import { ActionParamSelect } from '../components/ActionParamSelect';
import { VariableInput, getShouldChange } from '../../../schema-settings';
import { CollectionField } from '../../../data-source/collection-field';

const ActionParams = observer((props: any) => {
  const form = useForm();
  const field = useField<ArrayFieldModel>();
  const actionValue = field.form.getFieldState(props.parentPath.entire, (state) => state.value?.action);
  console.log('ActionParams path', props.parentPath, actionValue);
  const renderSchemaComponent = useCallback(({ value, onChange }): React.JSX.Element => {
    console.log('renderSchemaComponent', value, onChange);
    return <CollectionField value={value} onChange={onChange} />;
  }, []);

  return (
    <Space>
      <Field name="name" component={[ActionParamSelect, { action: actionValue }]} />
      <span>等于</span>
      <Field
        name="value"
        component={[
          VariableInput,
          {
            form,
            renderSchemaComponent,
            // shouldChange: getShouldChange({
            //   collectionField,
            //   variables,
            //   localVariables,
            //   getAllCollectionsInheritChain,
            // }),
          },
        ]}
      />
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
  const { action, parentPath } = props;
  return (
    <Space direction="vertical">
      {field?.value?.map((item, index) => (
        <ObjectField
          key={index}
          name={index}
          component={[ActionParams, { onRemove: () => field.remove(index), parentPath }]}
        />
      ))}
      <Button type="link" onClick={() => field.push({})}>
        添加参数
      </Button>
    </Space>
  );
});
