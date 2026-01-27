---
title: "Render record info card"
description: "Display current record information in an Ant Design card."
---

# Render record info card

Display current record information in an Ant Design card

```ts
const { Card, Descriptions, Tag } = ctx.libs.antd;

if (!ctx.record) {
  ctx.render('<div style="padding:16px;color:#999;">' + ctx.t('No record data') + '</div>');
  return;
}

const record = ctx.record;

ctx.render(
  <Card title={ctx.t('Record Details')} bordered style={{ margin: 0 }}>
    <Descriptions column={2} size="small">
      <Descriptions.Item label={ctx.t('ID')}>{record.id || '-'}</Descriptions.Item>
      <Descriptions.Item label={ctx.t('Status')}>
        <Tag color={record.status === 'active' ? 'green' : 'default'}>{record.status || '-'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label={ctx.t('Title')}>{record.title || '-'}</Descriptions.Item>
      <Descriptions.Item label={ctx.t('Created At')}>
        {record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'}
      </Descriptions.Item>
    </Descriptions>
  </Card>
);
```
