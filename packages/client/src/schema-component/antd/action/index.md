---
nav:
  path: /client
group:
  title: Schema Components
  path: /schema-components
---

# Action <Badge>待定</Badge>

## Nodes

已确定的节点：

- Action
- Action.URL
- Action.Link
- Action.Drawer
- Action.Drawer.Footer
- Action.Modal
- Action.Modal.Footer
- Action.Popover

不确定的节点：

- Action.Group
- Action.Dropdown
- Action.Window
- ActionBar

## Examples

### Action + Action.Drawer

<code src="./demos/demo1.tsx"/>

### VisibleContext + Action.Drawer

只配置 Action.Drawer，而不需要 Action，通过 VisibleContext 自定义按钮。

<code src="./demos/demo2.tsx"/>
