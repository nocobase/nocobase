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
import { observer } from '@formily/react';
import { Select, Space } from 'antd';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks';
import { DynamicComponent } from './DynamicComponent';
import { RemoveConditionContext } from './context';
import { useValues } from './useValues';

export const LinkageFilterItem = observer(
  (props: any) => {
    const { t } = useTranslation();
    const compile = useCompile();
    const remove = useContext(RemoveConditionContext);
    const [options, setOptions] = useState([]);
    const { schema, operators, operator, setOperator, rightVar, leftVar, setLeftValue, setRightValue } =
      useValues(options);
    const style = useMemo(() => ({ marginBottom: 8 }), []);

    const onOperatorsChange = useCallback(
      (value) => {
        setOperator(value);
      },
      [setOperator],
    );
    const removeStyle = useMemo(() => ({ color: '#bfbfbf' }), []);
    return (
      // 添加 nc-filter-item 类名是为了帮助编写测试时更容易选中该元素
      <div style={style} className="nc-filter-item">
        <Space wrap>
          <DynamicComponent
            value={leftVar}
            onChange={setLeftValue}
            setScopes={(data) => {
              setOptions(data);
            }}
            testid="left-filter-field"
            nullable={false}
            constantAbel={false}
            changeOnSelect={false}
            readOnly={true}
          />
          <Select
            // @ts-ignore
            role="button"
            data-testid="select-filter-operator"
            className={css`
              min-width: 110px;
            `}
            popupMatchSelectWidth={false}
            value={operator?.value}
            options={compile(operators)}
            onChange={onOperatorsChange}
            placeholder={t('Comparision')}
          />

          <div style={{ display: !operator?.noValue ? 'inline-flex' : 'none' }}>
            <DynamicComponent value={rightVar} schema={schema} onChange={setRightValue} testid="right-filter-field" />
          </div>

          {!props.disabled && (
            <a role="button" aria-label="icon-close">
              <CloseCircleOutlined onClick={remove} style={removeStyle} />
            </a>
          )}
        </Space>
      </div>
    );
  },
  { displayName: 'LinkageFilterItem' },
);
