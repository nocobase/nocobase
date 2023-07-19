import { Typography } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Title, Paragraph, Text, Link } = Typography;
const Demo = () => (
  <Typography>
    <Title level={4}>《故乡》 </Title>
    <Paragraph>——鲁迅</Paragraph>
    <Paragraph>
      <Text strong>深蓝的天空中挂着一轮金黄的圆月</Text>
      ，下面是海边的沙地，都种着一望无际的碧绿的西瓜，其间有一个十一二岁的少年，项带银圈，手捏一柄钢叉，
      <Text mark>向一匹猹尽力的刺去</Text>
      ，那猹却将身一扭，反从他的胯下逃走了。
    </Paragraph>
    <Paragraph>
      <ul>
        <li>
          <Link href="#">狂人日记</Link>
        </li>
        <li>
          <Link href="#">呐喊</Link>
        </li>
        <li>
          <Link href="#">彷徨</Link>
        </li>
      </ul>
    </Paragraph>
  </Typography>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorSuccess'],
  key: 'default',
};

export default componentDemo;
