import { CloseCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/react';
import { Cascader, Select, Space } from 'antd';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../..';
import { RemoveConditionContext } from './context';
import { DynamicComponent } from './DynamicComponent';
import { useValues } from './useValues';

export const FilterItem = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const remove = useContext(RemoveConditionContext);
  const { schema, fields, operators, dataIndex, operator, setDataIndex, setOperator, value, setValue } = useValues();
  return (
    <div style={{ marginBottom: 8 }}>
      <Space>
        <Cascader
          className={css`
            width: 160px;
          `}
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          changeOnSelect={false}
          value={dataIndex}
          options={compile(fields)}
          onChange={(value) => {
            setDataIndex(value);
          }}
          placeholder={t('Select Field')}
        />
        <Select
          value={operator?.value}
          options={compile(operators)}
          onChange={(value) => {
            setOperator(value);
          }}
          placeholder={t('Comparison')}
        />
        {!operator?.noValue &&
          React.createElement(DynamicComponent, {
            value,
            schema,
            onChange(value) {
              setValue(value);
            },
          })}
        <a>
          <CloseCircleOutlined onClick={() => remove()} style={{ color: '#bfbfbf' }} />
        </a>
      </Space>
    </div>
  );
});
