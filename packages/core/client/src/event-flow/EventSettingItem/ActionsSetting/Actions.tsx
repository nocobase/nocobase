/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayField as ArrayFieldModel, VoidField } from '@formily/core';
import { ArrayField, ObjectField, observer, useField, Field } from '@formily/react';
import { Space, Button, Cascader } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { ArrayBase } from '@formily/antd-v5';
import { useActionOptions } from './hooks/useActionOptions';
import { CloseCircleOutlined } from '@ant-design/icons';
import { ActionParamsField } from './ActionParams';
import { ActionSelect } from './ActionSelect';

interface LinkageRuleActionGroupProps {
  type: 'button' | 'field' | 'style';
  linkageOptions: any;
  collectionName: string;
}

const Action = observer(
  (props: any): any => {
    const { onRemove } = props;
    const field = useField<any>();
    field.onFieldChange = (field) => {
      console.log('field', field);
    };

    return (
      <Space align="start">
        <Field name="action" component={[ActionSelect]} />
        <ArrayField
          name={'params'}
          component={[ActionParamsField, { action: field.value.action?.value, parentPath: field.path }]}
        />
        {!props.disabled && (
          <a role="button" aria-label="icon-close">
            <CloseCircleOutlined onClick={onRemove} style={{ color: '#bfbfbf' }} />
          </a>
        )}
      </Space>
    );
  },
  { displayName: 'ActionRow' },
);

const Actions = withDynamicSchemaProps(
  observer((props: LinkageRuleActionGroupProps) => {
    const { t } = useTranslation();
    const field = useField<ArrayFieldModel>();
    return (
      <Space style={{ paddingLeft: 10 }} direction="vertical">
        {field?.value?.map((item, index) => {
          return <ObjectField key={index} name={index} component={[Action, { onRemove: () => field.remove(index) }]} />;
        })}
        <a onClick={() => field.push({})}>{t('添加动作')}</a>
      </Space>
    );
  }),
  { displayName: 'Actions' },
);

export const ActionsField = withDynamicSchemaProps(
  observer((props: LinkageRuleActionGroupProps) => {
    return <ArrayField name={'actions'} component={[Actions]} />;
  }),
  { displayName: 'ActionsField' },
);
