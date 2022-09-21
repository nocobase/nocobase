import { Field } from '@formily/core';
import { observer, useField } from '@formily/react';
import { Tree as AntdTree } from 'antd';
import React from 'react';
import { useProps } from '../../hooks/useProps';

export const Tree: any = observer((props) => {
  const field = useField<Field>();
  const { fieldNames, ...restProps } = useProps(props);
  return <AntdTree defaultExpandAll fieldNames={fieldNames} {...restProps} treeData={field.value} />;
});
