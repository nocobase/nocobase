import { CloseCircleOutlined } from '@ant-design/icons';
import { ObjectField as ObjectFieldModel } from '@formily/core';
import { ArrayField, connect, useField } from '@formily/react';
import { Select, Space } from 'antd';
import React, { useContext } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FilterLogicContext, RemoveConditionContext } from './context';
import { FilterItems } from './FilterItems';

export const FilterGroup = connect((props) => {
  const { bordered = true } = props;
  const field = useField<ObjectFieldModel>();
  const remove = useContext(RemoveConditionContext);
  const { t } = useTranslation();
  const keys = Object.keys(field.value || {});
  const logic = keys.includes('$or') ? '$or' : '$and';
  const setLogic = (value) => {
    const obj = field.value || {};
    field.value = {
      [value]: [...(obj[logic] || [])],
    };
  };
  return (
    <FilterLogicContext.Provider value={logic}>
      <div
        style={
          bordered
            ? {
                position: 'relative',
                border: '1px dashed #dedede',
                padding: 14,
                marginBottom: 8,
              }
            : {
                position: 'relative',
                marginBottom: 8,
              }
        }
      >
        {remove && (
          <a>
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
        <div style={{ marginBottom: 8 }}>
          <Trans>
            {'Meet '}
            <Select
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
          <ArrayField name={logic} component={[FilterItems]} />
        </div>
        <Space size={16} style={{ marginTop: 8, marginBottom: 8 }}>
          <a
            onClick={() => {
              const value = field.value || {};
              const items = value[logic] || [];
              items.push({});
              field.value = {
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
      </div>
    </FilterLogicContext.Provider>
  );
});
