---
title: "使用 ctx.libs.antd 组件"
description: "使用 Ant Design 组件获得更好的主题效果"
---

# 使用 ctx.libs.antd 组件

Ant Design 组件库已内置在 `ctx.libs.antd` 中。**建议使用 antd 组件而不是原生 HTML 元素**，这样可以获得更好的主题效果、样式一致性和交互体验。

## 基本使用

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

## 使用 antd 组件的优势

- **主题一致性**：自动继承应用的主题配置，支持暗色模式、自定义主题等
- **样式统一**：与系统其他部分保持一致的视觉风格
- **交互体验**：内置丰富的交互效果和动画
- **响应式设计**：自动适配不同屏幕尺寸
- **无障碍支持**：内置 ARIA 属性和键盘导航支持

## 常用组件示例

```tsx
const { Button, Card, Input, Space, Tag, Statistic, Row, Col } = ctx.libs.antd;

// 表单输入
const FormExample = () => (
  <Card title={ctx.t('Form')}>
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input placeholder={ctx.t('Enter name')} />
      <Button type="primary">{ctx.t('Submit')}</Button>
    </Space>
  </Card>
);

// 标签和统计
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

## 使用 Ant Design Icons

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(
  <Button icon={<UserOutlined />}>
    {ctx.t('User')}
  </Button>
);
```
