import { Typography } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Title } = Typography;

const Demo = () => <Title level={4}>Heading 4</Title>;

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['fontSizeHeading4'],
  key: 'heading4',
};

export default componentDemo;
