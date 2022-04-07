import { CloseCircleOutlined } from '@ant-design/icons';
import { observer } from '@formily/react';
import { Cascader, Select, Space } from 'antd';
import React, { useContext } from 'react';
import { useCompile } from '../..';
import { RemoveConditionContext } from './context';
import { DynamicComponent } from './DynamicComponent';
import { useValues } from './useValues';

export const FilterItem = observer((props: any) => {
  const compile = useCompile();
  const remove = useContext(RemoveConditionContext);
  const { schema, fields, operators, dataIndex, operator, setDataIndex, setOperator, value, setValue } = useValues();
  return (
    <div style={{ marginBottom: 8 }}>
      <Space>
        <Cascader
          fieldNames={{
            label: 'title',
            value: 'name',
            children: 'children',
          }}
          style={{
            width: 150,
          }}
          changeOnSelect={false}
          value={dataIndex}
          options={compile(fields)}
          onChange={(value) => {
            setDataIndex(value);
          }}
        />
        <Select
          value={operator?.value}
          options={compile(operators)}
          onChange={(value) => {
            setOperator(value);
          }}
          style={{
            minWidth: 100,
          }}
        />
        {!operator?.noValue &&
          React.createElement(DynamicComponent, {
            value,
            schema: {},
            onChange(value) {
              setValue(value);
            },
          })}
        <a>
          <CloseCircleOutlined onClick={() => remove()} />
        </a>
      </Space>
    </div>
  );
});
