---
title: DesignableBar - 配置操作栏
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# DesignableBar - 配置操作栏

用于修改节点的参数配置，DesignableBar 是所有配置操作栏的统称，不是固定的，可以根据不同节点定义不同的 `**.DesignableBar`。

## Node Tree

通常 DesignableBar 并不单独占用一个节点，而是节点的 x-designable-bar

<pre lang="tsx">
<Table x-decorator={'BlockItem'} x-designable-bar={'Table.DesignableBar'}/>
<Action x-designable-bar={'Action.DesignableBar'}/>
</pre>

数据组件的 DesignableBar 通常与 FormItem 搭配使用，非数据组件的 DesignableBar 通常与 BlockItem 搭配使用，也有少量如 Action、Menu 无需 BlockItem