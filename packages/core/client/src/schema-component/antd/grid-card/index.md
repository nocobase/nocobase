

# GridCard

以 Card 样式为基础的网格卡片组件。

用于展示表单的详细信息。

其要和 `GridCard.Decorator` 配合使用， `GridCard.Decorator` 是对 `DataBlockProvider` 的二次封装，其属性可以参考 [DataBlockProvider](/core/data-block/data-block-provider#属性详解)。

更多区块文档可查看 [Details](/components/details)、[Form](/componets/form-v2) 和 [Table](componets/table-v2)。

```ts
interface GridCardProps {
  columnCount?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  pagination?: PaginationProps;
}
```

<code src="./demos/basic.tsx"></code>
