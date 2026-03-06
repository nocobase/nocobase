:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/open-view).
:::

# ctx.openView()

Programově otevře zadaný pohled (zásuvka/drawer, dialogové okno, vložená stránka atd.). Poskytuje jej `FlowModelContext` a používá se k otevírání nakonfigurovaných pohledů `ChildPage` nebo `PopupAction` v situacích, jako jsou `JSBlock`, buňky tabulky nebo pracovní postupy.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock** | Otevření dialogu detailu/úprav po kliknutí na tlačítko, předání `filterByTk` aktuálního řádku. |
| **Buňka tabulky** | Vykreslení tlačítka v buňce, které po kliknutí otevře dialog s detailem řádku. |
| **Pracovní postup / JSAction** | Otevření dalšího pohledu nebo dialogu po úspěšné operaci. |
| **Asociační pole** | Otevření dialogu pro výběr/úpravu pomocí `ctx.runAction('openView', params)`. |

> Poznámka: `ctx.openView` je k dispozici v prostředí RunJS, kde existuje kontext `FlowModel`. Pokud model odpovídající `uid` neexistuje, automaticky se vytvoří a uloží `PopupActionModel`.

## Signatura

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Parametry

### uid

Unikátní identifikátor modelu pohledu. Pokud neexistuje, bude automaticky vytvořen a uložen. Doporučuje se používat stabilní UID, například `${ctx.model.uid}-detail`, aby bylo možné konfiguraci znovu použít při opakovaném otevírání stejného dialogu.

### Častá pole v options

| Pole | Typ | Popis |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Způsob otevření: zásuvka (drawer), dialogové okno nebo vložené. Výchozí je `drawer`. |
| `size` | `small` / `medium` / `large` | Velikost dialogu nebo zásuvky. Výchozí je `medium`. |
| `title` | `string` | Název pohledu. |
| `params` | `Record<string, any>` | Libovolné parametry předávané pohledu. |
| `filterByTk` | `any` | Hodnota primárního klíče, používá se pro scénáře detailu/úprav jednoho záznamu. |
| `sourceId` | `string` | ID zdrojového záznamu, používá se v asociačních scénářích. |
| `dataSourceKey` | `string` | Zdroj dat. |
| `collectionName` | `string` | Název kolekce. |
| `associationName` | `string` | Název asociačního pole. |
| `navigation` | `boolean` | Zda použít navigaci pomocí routování. Pokud jsou zadány `defineProperties` nebo `defineMethods`, je tato hodnota vynucena na `false`. |
| `preventClose` | `boolean` | Zda zabránit zavření. |
| `defineProperties` | `Record<string, PropertyOptions>` | Dynamické vložení vlastností do modelu v rámci pohledu. |
| `defineMethods` | `Record<string, Function>` | Dynamické vložení metod do modelu v rámci pohledu. |

## Příklady

### Základní použití: Otevření zásuvky (drawer)

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Detail'),
});
```

### Předání kontextu aktuálního řádku

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Detail řádku'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Otevření přes runAction

Pokud je model nakonfigurován s akcí `openView` (např. asociační pole nebo klikatelná pole), můžete zavolat:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Vložení vlastního kontextu

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Vztah s ctx.viewer a ctx.view

| Účel | Doporučené použití |
|------|----------|
| **Otevření nakonfigurovaného pohledu procesu** | `ctx.openView(uid, options)` |
| **Otevření vlastního obsahu (bez procesu)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Operace s aktuálně otevřeným pohledem** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` otevírá `FlowPage` (`ChildPageModel`), který interně vykresluje kompletní stránku procesu; `ctx.viewer` otevírá libovolný obsah Reactu.

## Poznámky

- Doporučuje se asociovat `uid` s `ctx.model.uid` (např. `${ctx.model.uid}-xxx`), aby se předešlo konfliktům mezi více bloky.
- Při předání `defineProperties` nebo `defineMethods` je `navigation` vynuceno na `false`, aby se zabránilo ztrátě kontextu po obnovení stránky.
- Uvnitř dialogu odkazuje `ctx.view` na aktuální instanci pohledu a `ctx.view.inputArgs` lze použít ke čtení parametrů předaných při otevírání.

## Související

- [ctx.view](./view.md): Aktuálně otevřená instance pohledu.
- [ctx.model](./model.md): Aktuální model, používaný ke konstrukci stabilního `popupUid`.