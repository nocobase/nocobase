

# GridCard

A grid card component based on the Card style.

Used to display detailed information of a form.

It should be used in conjunction with `GridCard.Decorator`, which is a secondary encapsulation of `DataBlockProvider`. Its properties can be referred to in [DataBlockProvider](/core/data-block/data-block-provider#property-details).

For more block documentation, please refer to [Details](/components/details), [Form](/components/form-v2), and [Table](/components/table-v2).

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
