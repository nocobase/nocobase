import React from 'react';
import { connect, useField } from '@formily/react';
import { Checkbox } from 'antd';
import { Field } from '@formily/core';

export const ChartFilterCheckbox = connect((props) => {
  const { content } = props;
  const field = useField<Field>();
  const handleClick = () => {
    field.setValue(!field.value);
  };
  return (
    <Checkbox onClick={handleClick} checked={field.value}>
      {content}
    </Checkbox>
  );
});
