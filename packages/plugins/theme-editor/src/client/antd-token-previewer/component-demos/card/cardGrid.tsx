import { Card } from 'antd';
import type { CSSProperties } from 'react';
import React from 'react';
import type { ComponentDemo } from '../../interface';

const gridStyle: CSSProperties = {
  width: '25%',
  textAlign: 'center',
};

const Demo = () => (
  <Card title="Card Title">
    <Card.Grid style={gridStyle}>Content</Card.Grid>
    <Card.Grid hoverable={false} style={gridStyle}>
      Content
    </Card.Grid>
    <Card.Grid style={gridStyle}>Content</Card.Grid>
    <Card.Grid style={gridStyle}>Content</Card.Grid>
    <Card.Grid style={gridStyle}>Content</Card.Grid>
    <Card.Grid style={gridStyle}>Content</Card.Grid>
    <Card.Grid style={gridStyle}>Content</Card.Grid>
  </Card>
);

const componentDemo: ComponentDemo = {
  demo: <Demo />,
  tokens: ['colorBorderSecondary'],
  key: 'cardGrid',
};

export default componentDemo;
