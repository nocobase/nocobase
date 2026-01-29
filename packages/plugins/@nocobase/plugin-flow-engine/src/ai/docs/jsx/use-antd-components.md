---
title: "Use ctx.libs.antd Components"
description: "Use Ant Design components for better theming"
---

# Use ctx.libs.antd Components

The Ant Design component library is built into `ctx.libs.antd`. **We recommend using antd components instead of native HTML elements**, which provides better theming, consistent styles, and interactions.

## Basic Usage

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Welcome')} style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </Card>
);
```

## Advantages of Using antd Components

- **Theme consistency**: Automatically inherits the app's theme configuration, including dark mode and custom themes
- **Unified styling**: Consistent visual style across the system
- **Interaction**: Rich built-in interactions and animations
- **Responsive design**: Adapts to different screen sizes
- **Accessibility**: Built-in ARIA attributes and keyboard navigation

## Common Component Examples

```tsx
const { Button, Card, Input, Space, Tag, Statistic, Row, Col } = ctx.libs.antd;

// Form input
const FormExample = () => (
  <Card title={ctx.t('Form')}>
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input placeholder={ctx.t('Enter name')} />
      <Button type="primary">{ctx.t('Submit')}</Button>
    </Space>
  </Card>
);

// Tags and statistics
const StatsExample = () => (
  <Row gutter={16}>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Total')} value={100} />
      </Card>
    </Col>
    <Col span={6}>
      <Card>
        <Tag color="success">{ctx.t('Active')}</Tag>
      </Card>
    </Col>
  </Row>
);

ctx.render(<FormExample />);
```

## Use Ant Design Icons

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(
  <Button icon={<UserOutlined />}>
    {ctx.t('User')}
  </Button>
);
```
