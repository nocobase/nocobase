/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { TreeSelect } from '@formily/antd-v5';
import { observer } from '@formily/react';
import { uid } from '@formily/shared';
import { Select, Space } from 'antd';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../..';
import { DynamicComponent } from '../DynamicComponent';
import { RemoveActionContext } from '../context';
import { ActionType } from '../type';
import { useValues } from '../useValues';

export const BlockLinkageRuleAction = observer(
  (props: any) => {
    const { value, options } = props;
    const { t } = useTranslation();
    const compile = useCompile();
    const [editFlag, setEditFlag] = useState(false);
    const remove = useContext(RemoveActionContext);
    const { schema, operator, setOperator, setValue } = useValues(options);
    const operators = useMemo(
      () =>
        compile([
          { label: t('Visible'), value: ActionType.Visible, schema: {} },
          { label: t('Hidden'), value: ActionType.Hidden, schema: {} },
        ]),
      [compile, t],
    );

    const onChange = useCallback(
      (value) => {
        const flag = [ActionType.Value].includes(value);
        setEditFlag(flag);
        setOperator(value);
      },
      [setOperator],
    );

    const onChangeValue = useCallback(
      (value) => {
        setValue(value);
      },
      [setValue],
    );

    const closeStyle = useMemo(() => ({ color: '#bfbfbf' }), []);

    return (
      <div style={{ marginBottom: 8 }}>
        <Space>
          <Select
            data-testid="select-linkage-properties"
            popupMatchSelectWidth={false}
            value={operator}
            options={operators}
            onChange={onChange}
            placeholder={t('action')}
          />
          {editFlag &&
            React.createElement(DynamicComponent, {
              value,
              schema,
              onChange: onChangeValue,
            })}
          {!props.disabled && (
            <a role="button" aria-label="icon-close">
              <CloseCircleOutlined onClick={remove} style={closeStyle} />
            </a>
          )}
        </Space>
      </div>
    );
  },
  { displayName: 'FormButtonLinkageRuleAction' },
);
