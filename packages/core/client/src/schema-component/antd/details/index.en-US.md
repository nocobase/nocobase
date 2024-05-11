

# Details

Form details block.

Used to display detailed information of a form.

```ts
import { FormProps } from '@nocobase/client';

type DetailsProps = FormProps;
```

It needs to be used in conjunction with `DetailsBlockProvider`. `DetailsBlockProvider` is a secondary encapsulation of `DataBlockProvider`, and its properties can refer to [DataBlockProvider](/core/data-block/data-block-provider#property-details).

For more configuration options regarding Form, please refer to [Form](/components/form).

Please note that the Schema where the `Details` component is located needs to be set with `'x-pattern': 'readPretty'`.

## Single Form Data

<code src="./demos/new-demos/single.tsx"></code>

## List Form Data

<code src="./demos/new-demos/list.tsx"></code>
