---
title: Menu - 菜单
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Menu - 菜单

需要 antd v4.16+ 支持，在此之前的 Menu.Item 不支持 Fragment 包裹。

## Node Tree

<pre lang="tsx">
<Menu>
  // 菜单分组
  <Menu.ItemGroup>
    <Menu.Item/>
  </Menu.ItemGroup>
  // 子菜单
  <Menu.SubMenu>
    <Menu.Item/>
  </Menu.SubMenu>
  // 菜单项
  <Menu.Item/>
  // 分割线
  <Menu.Divider/>

  // 其他一些基于 Menu.Item 的延伸

  // 外链
  <Menu.URL/>
  // 内链
  <Menu.Link/>
  // 操作，用法与 Action 相同
  <Menu.Action/>
  // 新增菜单项
  <Menu.AddNew/>
</Menu>
</pre>

## Designable Bar

- Menu.DesignableBar

## Examples

### 横向菜单

<code src="./demos/demo1.tsx"/>

### 竖向菜单

<code src="./demos/demo2.tsx"/>

### 混合菜单

<code src="./demos/demo4.tsx"/>

### Menu.Action

<code src="./demos/demo3.tsx"/>
