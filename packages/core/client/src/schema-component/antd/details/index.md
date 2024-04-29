

# Details

表单详情区块。

用于展示表单的详细信息。

```ts
import { FormProps } from '@nocobase/client';

type DetailsProps = FormProps;
```

其要和 `DetailsBlockProvider` 配合使用， `DetailsBlockProvider` 是对 `DataBlockProvider` 的二次封装，其属性可以参考 [DataBlockProvider](/core/data-block/data-block-provider#属性详解)。

关于 Form 更多的配置请参考 [Form](/components/form)。

需要注意 `Details` 组件所在的 Schema 中需要设置 `'x-pattern': 'readPretty'`。

## Single Form Data

<code src="./demos/new-demos/single.tsx"></code>

## List Form Data

<code src="./demos/new-demos/list.tsx"></code>
