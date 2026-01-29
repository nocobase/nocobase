---
title: "Render statistics cards"
description: "Display multiple statistic cards with numbers from API."
---

# Render statistics cards

Display multiple statistic cards with numbers from API

```ts
const { Card, Statistic, Row, Col } = ctx.libs.antd;

const res = await ctx.api.request({
  url: 'users:list',
  method: 'get',
  params: {
    pageSize: 100,
    appends: ['roles'],
  },
});

const users = res?.data?.data || [];

const total = users.length;
const adminCount = users.filter((user) =>
  Array.isArray(user?.roles) && user.roles.some((role) => role?.name === 'admin')
).length;
const withEmail = users.filter((user) => !!user?.email).length;
const distinctRoles = new Set(
  users
    .flatMap((user) => (Array.isArray(user?.roles) ? user.roles.map((role) => role?.name) : []))
    .filter(Boolean),
).size;

ctx.render(
  <Row gutter={16}>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Total users')} value={total} valueStyle={{ color: '#3f8600' }} />
      </Card>
    </Col>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Administrators')} value={adminCount} valueStyle={{ color: '#1890ff' }} />
      </Card>
    </Col>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Users with email')} value={withEmail} valueStyle={{ color: '#faad14' }} />
      </Card>
    </Col>
    <Col span={6}>
      <Card>
        <Statistic title={ctx.t('Distinct roles')} value={distinctRoles} valueStyle={{ color: '#cf1322' }} />
      </Card>
    </Col>
  </Row>
);
```
