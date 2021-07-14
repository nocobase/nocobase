---
title: FormItem - 表单项
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# FormItem - 表单项

## Node Tree

通常 FormItem 并不单独占用一个节点，而是节点的 x-decorator

<pre lang="tsx">
<Input x-decorator={'FormItem'}/>
</pre>

FormItem 的作用主要用于处理表单项（控件）的校验、布局等

<pre lang="tsx">
<Input x-decorator={'FormItem'} x-designable-bar={'Input.DesignableBar'}/>
</pre>
