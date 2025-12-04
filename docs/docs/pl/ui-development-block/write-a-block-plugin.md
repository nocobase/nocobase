:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Tworzenie pierwszej wtyczki bloku

Zanim zaczniemy, zalecamy zapoznanie się z artykułem „[Tworzenie pierwszej wtyczki](../plugin-development/write-your-first-plugin.md)”, aby dowiedzieć się, jak szybko stworzyć podstawową wtyczkę. Następnie, rozszerzymy ją o prostą funkcjonalność bloku.

## Krok 1: Tworzenie pliku modelu bloku

Proszę utworzyć nowy plik w katalogu wtyczki: `client/models/SimpleBlockModel.tsx`

## Krok 2: Tworzenie zawartości modelu

W pliku proszę zdefiniować i zaimplementować podstawowy model bloku, włączając w to logikę jego renderowania:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../utils';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return (
      <div>
        <h1>Hello, NocoBase!</h1>
        <p>This is a simple block rendered by SimpleBlockModel.</p>
      </div>
    );
  }
}

SimpleBlockModel.define({
  label: tExpr('Hello block'),
});
```

## Krok 3: Rejestracja modelu bloku

Proszę wyeksportować nowo utworzony model w pliku `client/models/index.ts`:

```ts
import { ModelConstructor } from '@nocobase/flow-engine';
import { SimpleBlockModel } from './SimpleBlockModel';

export default {
  SimpleBlockModel,
} as Record<string, ModelConstructor>;
```

## Krok 4: Aktywacja i testowanie bloku

Po włączeniu wtyczki, w rozwijanym menu „Dodaj blok” zobaczą Państwo nową opcję bloku: **Hello block**.

Demonstracja działania:

![20251102223200_rec_](https://static-docs.nocobase.com/20251102223200_rec_.gif)

## Krok 5: Dodawanie możliwości konfiguracji do bloku

Następnie, dodamy do bloku konfigurowalną funkcjonalność za pomocą **Flow** (przepływu pracy), co umożliwi użytkownikom edycję zawartości bloku bezpośrednio w interfejsie.

Proszę kontynuować edycję pliku `SimpleBlockModel.tsx`:

```tsx
import { BlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '../locale';

export class SimpleBlockModel extends BlockModel {
  renderComponent() {
    return <div dangerouslySetInnerHTML={{ __html: this.props.html }} />;
  }
}

SimpleBlockModel.define({
  label: tExpr('Simple block'),
});

SimpleBlockModel.registerFlow({
  key: 'flow1',
  title: tExpr('Simple Block Flow'),
  on: 'beforeRender',
  steps: {
    editHtml: {
      title: tExpr('Edit HTML Content'),
      uiSchema: {
        html: {
          type: 'string',
          title: tExpr('HTML Content'),
          'x-decorator': 'FormItem',
          'x-component': 'Input.TextArea',
        },
      },
      defaultParams: {
        html: `<h3>This is a simple block</h3>
<p>You can edit the HTML content.</p>`,
      },
      handler(ctx, params) {
        ctx.model.props.html = params.html;
      },
    },
  },
});
```

Demonstracja działania:

![20251102222856_rec_](https://static-docs.nocobase.com/20251102222856_rec_.gif)

## Podsumowanie

W tym artykule przedstawiliśmy, jak stworzyć prostą wtyczkę bloku, w tym:

- Jak zdefiniować i zaimplementować model bloku
- Jak zarejestrować model bloku
- Jak dodać konfigurowalną funkcjonalność do bloku za pomocą **Flow** (przepływu pracy)

Pełny kod źródłowy znajdą Państwo w przykładzie: [Przykład prostego bloku](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-simple-block)