import { CloseCircleOutlined } from '@ant-design/icons';
import { observer, useField } from '@formily/react';
import { Cascader, Select, Space } from 'antd';
import React, { useContext } from 'react';
import { useCompile } from '../..';
import { RemoveConditionContext } from './context';
import { DynamicComponent } from './DynamicComponent';
import { useValues } from './useValues';

export const FilterItem = observer((props: any) => {
  const field = useField<any>();
  const remove = useContext(RemoveConditionContext);
  const { option, options, dataIndex, operator, setDataIndex, setOperator, value, setValue } = useValues();
  const compile = useCompile();
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
          key={field.address.toString()}
          value={dataIndex}
          options={compile(options)}
          onChange={(value) => {
            setDataIndex(value);
          }}
        />
        <Select
          value={operator}
          options={compile(option?.operators)}
          onChange={(value) => {
            setOperator(value);
          }}
          style={{
            minWidth: 100,
          }}
        />
        {React.createElement(DynamicComponent, {
          value,
          schema: option?.schema,
          onChange(value) {
            setValue(value);
          },
        })}
        <CloseCircleOutlined onClick={() => remove()} />
      </Space>
    </div>
  );
});
