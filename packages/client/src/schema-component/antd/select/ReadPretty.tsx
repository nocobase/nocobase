import { isArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { isValid, toArr } from '@formily/shared';
import { Tag } from 'antd';
import { isEmpty } from 'lodash';
import React from 'react';
import { useCompile } from '../../hooks/useCompile';

type Composed = {
  Select?: React.FC<any>;
  Object?: React.FC<any>;
};
export const ReadPretty: Composed = () => null;

ReadPretty.Select = (props) => {
  if (!isValid(props.value)) {
    return <div></div>;
  }
  const compile = useCompile();
  const field = useField<any>();
  if (isArrayField(field) && field?.value?.length === 0) {
    return <div></div>;
  }
  const dataSource = field.dataSource || [];
  console.log('field.value', field.value, dataSource);
  const values = toArr(field.value);
  const findOptions = (options: any[]) => {
    let current = [];
    for (const option of options) {
      if (values.includes(option.value)) {
        current.push(option);
      }
      if (option.children) {
        const children = findOptions(option.children);
        current.push(...children);
      }
    }
    return current;
  };
  const options = findOptions(dataSource);
  return (
    <div>
      {options.map((option, key) => (
        <Tag key={key} color={option.color}>
          {compile(option.label)}
        </Tag>
      ))}
    </div>
  );
};

ReadPretty.Object = (props: any) => {
  const { value, fieldNames = { label: 'label', color: 'color' }, ...others } = props;
  if (!value) {
    return null;
  }
  if (isEmpty(value)) {
    return null;
  }
  const values = toArr(value);
  return (
    <div>
      {values.map((val) =>
        fieldNames.color ? (
          <Tag color={val[fieldNames.color]}>{val[fieldNames.label]}</Tag>
        ) : (
          <Tag>{val[fieldNames.label]}</Tag>
        ),
      )}
    </div>
  );
};
