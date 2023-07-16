import { Anchor, theme } from 'antd';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const { Link } = Anchor;
const Demo = () => {
  const { token } = theme.useToken();

  return (
    <div style={{ background: token.colorBorderSecondary, padding: 12 }}>
      <Anchor>
        <Link href="#components-anchor-demo-basic" title="Basic demo" />
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
  tokens: ['colorSplit'],
  key: 'anchorInLayout',
};

export default componentDemo;
