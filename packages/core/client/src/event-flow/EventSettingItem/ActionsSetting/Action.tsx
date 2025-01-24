/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField as ArrayFieldModel, VoidField, ObjectField as ObjectFieldModel } from '@formily/core';
import { ArrayField, Field, ObjectField, observer, useField } from '@formily/react';
import { Button, Cascader, Input, Space, TreeSelect } from 'antd';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import {
  FormButtonLinkageRuleAction,
  FormFieldLinkageRuleAction,
  FormStyleLinkageRuleAction,
} from './LinkageRuleAction';
import { RemoveActionContext } from './context';
import { useControllableValue } from 'ahooks';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useActionOptions } from './hooks/useActionOptions';

const ActionParams = observer((props) => {
  const field = useField<ArrayFieldModel>();
  return (
    <div>
      {field?.value?.map((item, index) => (
        <div key={index}>
          <Input />
        </div>
      ))}
    </div>
  );
});

export const ActionRow = observer(
  (props: any): any => {
    const { onRemove } = props;
    const options = useActionOptions();
    const field = useField<any>();
    const onClick = useCallback(() => {
      console.log('field2', field);
      // const f = field.query('.params').take() as ObjectFieldModel;
      // field.val = field.data || {};
      // field.data.params = field.data.params || [];
      // field.data.params.push({});
      // const items = f.value || [];
      // items.push({});
      // f.value = items;
      // f.initialValue = items;
    }, [field]);
    return (
      <div>
        <Space>
          <Field name="action" component={[Cascader, { options }]} />
          <div>
            <ArrayField name={'params'} component={[ActionParams, {}]} disabled={false} />
            <Button onClick={onClick}>添加参数</Button>
          </div>
          {!props.disabled && (
            <a role="button" aria-label="icon-close">
              <CloseCircleOutlined onClick={onRemove} style={{ color: '#bfbfbf' }} />
            </a>
          )}
        </Space>
      </div>
    );
  },
  { displayName: 'ActionRow' },
);

export const Action = observer(
  (props: any): any => {
    const { linkageOptions, category, elementType } = props;
    const field = useField<ArrayFieldModel>();
    const type = category === 'default' ? elementType : category;
    const componentMap: {
      [key: string]: any;
    } = {
      button: FormButtonLinkageRuleAction,
      field: FormFieldLinkageRuleAction,
      style: FormStyleLinkageRuleAction,
    };

    // console.log('field?.value', field.value);

    return field?.value?.map((item, index) => {
      return (
        <RemoveActionContext.Provider key={index} value={() => field.remove(index)}>
          <ObjectField name={index} component={[ActionRow]} />
        </RemoveActionContext.Provider>
      );
    });
  },
  { displayName: 'Action' },
);
