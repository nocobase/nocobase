---
title: "Render Ant Design icons"
description: "Render Ant Design icons with buttons inside the block container."
---

# Render Ant Design icons

Render Ant Design icons with buttons inside the block container

```ts
// Render Ant Design icons with buttons via ctx.libs
const { React, antd, antdIcons } = ctx.libs;
const { Button, Space } = antd;
const { PlusOutlined, EditOutlined, DeleteOutlined } = antdIcons;

const IconButtons = () => (
  <Space style={{ padding: 12 }}>
    <Button type="primary" icon={<PlusOutlined />}>
      {ctx.t('Add')}
    </Button>
    <Button icon={<EditOutlined />}>{ctx.t('Edit')}</Button>
    <Button danger icon={<DeleteOutlined />}>
      {ctx.t('Delete')}
    </Button>
  </Space>
);

ctx.render(<IconButtons />);
```
