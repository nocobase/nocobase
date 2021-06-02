import React from 'react';
import { connect, mapProps, mapReadPretty, useField } from '@formily/react';
import { Card } from 'antd';

function Test(props) {
  return (
    <Card>Block</Card>
  )
}

export const Block = connect(Test, mapProps(
  (props, field) => {
    // console.log({ props, field });
    return {
      ...props,
    };
  },
));

export default Block;
