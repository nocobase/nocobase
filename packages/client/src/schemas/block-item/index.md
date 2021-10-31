---
nav:
  path: /components
group:
  path: /components/schema-components
---

# BlockItem - 区块项

## Node Tree

通常 BlockItem 并不单独占用一个节点，而是节点的 x-decorator

<pre lang="tsx">
<Table x-decorator={'BlockItem'}/>
</pre>

BlockItem 的作用主要用于处理 DesignableBar，如：

<pre lang="tsx">
<Table x-decorator={'BlockItem'} x-designable-bar={'Table.DesignableBar'}/>
</pre>