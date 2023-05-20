import { useFormLayout } from '@formily/antd';
import type { SpaceProps } from 'antd';
import { Divider, Space as AntdSpace } from 'antd';
import React from 'react';

export const Space: React.FC<SpaceProps> = (props) => {
  let { split } = props;
  if (split === '|') {
    split = <Divider type="vertical" style={{ margin: '0 2px' }} />;
  }
  const layout = useFormLayout();
  return React.createElement(AntdSpace, {
    size: props.size ?? layout?.spaceGap,
    ...props,
    split,
  });
};

export default Space;
