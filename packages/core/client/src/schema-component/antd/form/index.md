---
nav:
  path: /client
group:
  path: /schema-components
---

# Form

## Examples

### 基础用法

<code src="./demos/demo2.tsx"/>

### Form Decorator

Form 也可以作 decorator 存在

<code src="./demos/demo6.tsx"/>

和 Action.Drawer 结合就是 DrawerForm 了

<code src="./demos/demo1.tsx"/>

### initialValue 初始化

<code src="./demos/demo3.tsx"/>

### decorator 的 initialValue

<code src="./demos/demo4.tsx"/>

### 远程初始化数据

<code src="./demos/demo5.tsx"/>

### useValues

<code src="./demos/demo7.tsx"/>

### DrawerForm

自由控制弹窗表单（Drawer+Form），并异步填充表单数据

<code src="./demos/demo8.tsx"/>

## API

属性说明

- `initialValue` 静态的初始化数据
- `request` 远程请求参数
- `useValues` 自定义的 useRequest
