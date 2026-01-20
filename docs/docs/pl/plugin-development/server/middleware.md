:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Middleware

Middleware w NocoBase Server to w zasadzie **middleware Koa**. Mogą Państwo manipulować obiektem `ctx` w celu obsługi żądań i odpowiedzi, dokładnie tak jak w Koa. Jednakże, ponieważ NocoBase musi zarządzać logiką na różnych warstwach biznesowych, umieszczenie wszystkich middleware w jednym miejscu znacznie utrudniłoby ich utrzymanie i zarządzanie.

Z tego powodu NocoBase dzieli middleware na **cztery warstwy**:

1.  **Middleware na poziomie źródła danych**: `app.dataSourceManager.use()`  
    Działa tylko na żądania dotyczące **konkretnego źródła danych**. Zazwyczaj używa się go do logiki związanej z połączeniami do bazy danych, walidacją pól lub obsługą transakcji dla danego źródła danych.

2.  **Middleware na poziomie zasobów**: `app.resourceManager.use()`  
    Działa tylko dla zdefiniowanych zasobów (Resource). Jest odpowiednie do obsługi logiki na poziomie zasobów, takiej jak uprawnienia do danych czy formatowanie.

3.  **Middleware na poziomie uprawnień**: `app.acl.use()`  
    Wykonuje się przed sprawdzeniem uprawnień, służy do weryfikacji uprawnień użytkownika lub ról.

4.  **Middleware na poziomie aplikacji**: `app.use()`  
    Wykonuje się dla każdego żądania. Jest odpowiednie do logowania, ogólnej obsługi błędów, przetwarzania odpowiedzi itp.

## Rejestracja middleware

Middleware zazwyczaj rejestruje się w metodzie `load` wtyczki, na przykład:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware na poziomie aplikacji
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware źródła danych
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware uprawnień
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware zasobów
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Kolejność wykonania

Kolejność wykonania middleware jest następująca:

1.  Najpierw wykonuje się middleware uprawnień dodane przez `acl.use()`.
2.  Następnie wykonuje się middleware zasobów dodane przez `resourceManager.use()`.
3.  Następnie wykonuje się middleware źródła danych dodane przez `dataSourceManager.use()`.
4.  Na końcu wykonuje się middleware aplikacji dodane przez `app.use()`.

## Mechanizm wstawiania: before / after / tag

Aby elastyczniej kontrolować kolejność middleware, NocoBase udostępnia parametry `before`, `after` i `tag`:

-   **tag**: Nadaje middleware znacznik, który może być później użyty przez inne middleware.
-   **before**: Wstawia middleware przed middlewarem z określonym znacznikiem `tag`.
-   **after**: Wstawia middleware po middleware z określonym znacznikiem `tag`.

Przykład:

```ts
// Zwykłe middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 zostanie umieszczone przed m1
app.use(m4, { before: 'restApi' });

// m5 zostanie wstawione pomiędzy m2 a m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Jeśli nie zostanie określona pozycja, domyślna kolejność wykonania nowo dodanego middleware to:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Przykład modelu cebulowego

Kolejność wykonania middleware jest zgodna z **modelem cebulowym** Koa, co oznacza, że middleware najpierw wchodzi na stos, a następnie z niego wychodzi.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Przykłady kolejności wyjścia dla różnych interfejsów:

-   **Zwykłe żądanie**: `/api/hello`  
    Wyjście: `[1,2]` (zasób niezdefiniowany, nie wykonuje middleware `resourceManager` i `acl`)  

-   **Żądanie zasobu**: `/api/test:list`  
    Wyjście: `[5,3,7,1,2,8,4,6]`  
    Middleware wykonuje się zgodnie z kolejnością warstw i modelem cebulowym.

## Podsumowanie

-   Middleware NocoBase to rozszerzenie middleware Koa.
-   Cztery warstwy: Aplikacja -> Źródło danych -> Zasób -> Uprawnienia.
-   Mogą Państwo używać `before` / `after` / `tag` do elastycznego kontrolowania kolejności wykonania.
-   Przestrzega modelu cebulowego Koa, zapewniając, że middleware jest komponowalne i zagnieżdżalne.
-   Middleware na poziomie źródła danych działa tylko na żądania dotyczące określonego źródła danych, a middleware na poziomie zasobów działa tylko na zdefiniowane żądania zasobów.