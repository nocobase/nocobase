---
title: Kanban - 看板
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Kanban - 看板

## Node Tree

<pre lang="tsx">
<Kanban>
  <Kanban.Card>
    // 看板卡片
    <Kanban.Item>
      <Input/>
    </Kanban.Item>
  </Kanban.Card>
  <Kanban.Card.View>
    // 查看卡片详情
  </Kanban.Card.View>
</Kanban>
</pre>

## Examples

<code src="./demos/demo1.tsx" />
