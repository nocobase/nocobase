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
import { sortTree } from '@nocobase/utils/client';
import { Cascader, Select, Space } from 'antd';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';
import { DynamicComponent } from './DynamicComponent';
import { RemoveConditionContext } from './context';
import { useValues } from './useValues';

export const FilterItem = observer(
  (props: any) => {
    const { t } = useTranslation();
    const compile = useCompile();
    const remove = useContext(RemoveConditionContext);
    const {
      schema,
      fields: _fields,
      operators,
      dataIndex,
      operator,
      setDataIndex,
      setOperator,
      value,
      setValue,
      collectionField,
    } = useValues();
    const fields = sortTree(
      _fields,
      (node) => {
        if (node.children?.length) {
          return 0;
        }
        return 1;
      },
      'children',
      false,
    );
    const style = useMemo(() => ({ marginBottom: 8 }), []);
    const fieldNames = useMemo(
      () => ({
        label: 'title',
        value: 'name',
        children: 'children',
      }),
      [],
    );
    const onChange = useCallback(
      (value) => {
        setDataIndex(value);
      },
      [setDataIndex],
    );

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
          <Cascader
            // @ts-ignore
            role="button"
            data-testid="select-filter-field"
            className={css`
              width: 160px;
            `}
            popupClassName={css`
              .ant-cascader-menu {
                height: fit-content;
                max-height: 50vh;
              }
            `}
            showSearch
            fieldNames={fieldNames}
            changeOnSelect={false}
            value={dataIndex}
            options={compile(fields)}
            onChange={onChange}
            placeholder={t('Select field')}
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
          {!operator?.noValue ? (
            <DynamicComponent value={value} schema={schema} collectionField={collectionField} onChange={setValue} />
          ) : null}
          {!props.disabled && (
            <a role="button" aria-label="icon-close">
              <CloseCircleOutlined onClick={remove} style={removeStyle} />
            </a>
          )}
        </Space>
      </div>
    );
  },
  { displayName: 'FilterItem' },
);
