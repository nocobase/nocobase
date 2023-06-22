---
group:
  title: Schema Components
  order: 3
---

# Form

## Examples

### 基础用法

<code src="./demos/demo2.tsx"></code>

### Form Decorator

Form 也可以作 decorator 存在

<code src="./demos/demo6.tsx"></code>

和 Action.Drawer 结合就是 DrawerForm 了

<code src="./demos/demo1.tsx"></code>

### initialValue 初始化

<code src="./demos/demo3.tsx"></code>

### decorator 的 initialValue

<code src="./demos/demo4.tsx"></code>

### 远程初始化数据

<code src="./demos/demo5.tsx"></code>

### useValues

<code src="./demos/demo7.tsx"></code>

### DrawerForm

自由控制弹窗表单（Drawer+Form），并异步填充表单数据

<code src="./demos/demo8.tsx"></code>

## API

属性说明

- `initialValue` 静态的初始化数据
- `request` 远程请求参数
- `useValues` 自定义的 useRequest
