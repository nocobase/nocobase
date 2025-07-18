/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CloseCircleOutlined } from '@ant-design/icons';
import { ObjectField as ObjectFieldModel } from '@formily/core';
import { ArrayField, connect, useField } from '@formily/react';
import { Select, Space } from 'antd';
import React, { useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useToken } from '../__builtins__';
import { FilterItems } from './FilterItems';
import { FilterLogicContext, RemoveConditionContext } from './context';

export const FilterGroup = connect((props) => {
  const { bordered = true, disabled } = props;
  const field = useField<ObjectFieldModel>();
  const remove = useContext(RemoveConditionContext);
  const { t } = useTranslation();
  const { token } = useToken();

  const keys = Object.keys(field.value || {});
  const logic = keys.includes('$or') ? '$or' : '$and';
  const setLogic = (value) => {
    const obj = field.value || {};
    field.value = {
      [value]: [...(obj[logic] || [])],
    };
  };
  const mergedDisabled = disabled || field.disabled;
  return (
    <FilterLogicContext.Provider value={logic}>
      <div
        style={
          bordered
            ? {
                position: 'relative',
                border: `1px dashed ${token.colorBorder}`,
                padding: token.paddingSM,
                marginBottom: token.marginXS,
              }
            : {
                position: 'relative',
                marginBottom: token.marginXS,
              }
        }
      >
        {remove && !mergedDisabled && (
          <a role="button" aria-label="icon-close">
            <CloseCircleOutlined
              style={{
                position: 'absolute',
                right: 10,
                top: 10,
                color: '#bfbfbf',
              }}
              onClick={() => remove()}
            />
          </a>
        )}
        <div style={{ marginBottom: 8, color: token.colorText }}>
          <Trans>
            {'Meet '}
            <Select
              // @ts-ignore
              role="button"
              data-testid="filter-select-all-or-any"
              style={{ width: 'auto' }}
              value={logic}
              onChange={(value) => {
                setLogic(value);
              }}
            >
              <Select.Option value={'$and'}>All</Select.Option>
              <Select.Option value={'$or'}>Any</Select.Option>
            </Select>
            {' conditions in the group'}
          </Trans>
        </div>
        <div>
          <ArrayField name={`${logic}`} component={[FilterItems]} disabled={mergedDisabled} />
        </div>
        {!mergedDisabled && (
          <Space size={16} style={{ marginTop: 8, marginBottom: 8 }}>
            <a
              onClick={() => {
                const value = field.value || {};
                const items = value[logic] || [];
                items.push({});
                field.value = {
                  [logic]: items,
                };
                field.initialValue = {
                  [logic]: items,
                };
              }}
            >
              {t('Add condition')}
            </a>
            <a
              onClick={() => {
                const value = field.value || {};
                const items = value[logic] || [];
                items.push({
                  $and: [{}],
                });
                field.value = {
                  [logic]: items,
                };
              }}
            >
              {t('Add condition group')}
            </a>
          </Space>
        )}
      </div>
    </FilterLogicContext.Provider>
  );
});
