import { Anchor } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Link } = Anchor;
const Demo = () => {
  return (
    <div style={{ padding: 12 }}>
      <Anchor>
        <Link href="#" title="Basic demo" />
        <Link href="#components-anchor-demo-static" title="Static demo" />
        <Link href="#API" title="API">
          <Link href="#Anchor-Props" title="Anchor Props" />
          <Link href="#Link-Props" title="Link Props" />
        </Link>
      </Anchor>
    </div>
  );
};

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorPrimary', 'colorSplit', 'colorBgContainer'],
  key: 'anchor',
};

export default componentDemo;
