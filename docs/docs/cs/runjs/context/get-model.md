:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/get-model).
:::

# ctx.getModel()

Získá instanci modelu (např. `BlockModel`, `PageModel`, `ActionModel` atd.) z aktuálního enginu nebo zásobníku zobrazení (view stack) na základě `uid` modelu. Používá se v RunJS pro přístup k jiným modelům napříč bloky, stránkami nebo vyskakovacími okny (popupy).

Pokud potřebujete pouze model nebo blok, ve kterém se nachází aktuální kontext spuštění, upřednostněte použití `ctx.model` nebo `ctx.blockModel` před `ctx.getModel`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock / JSAction** | Získání modelů jiných bloků na základě známého `uid` pro čtení nebo zápis jejich `resource`, `form`, `setProps` atd. |
| **RunJS v popupech** | Při potřebě přístupu k modelu na stránce, která otevřela popup, předejte `searchInPreviousEngines: true`. |
| **Vlastní akce** | Vyhledání formulářů nebo podmodelů v konfiguračním panelu podle `uid` napříč zásobníky zobrazení pro čtení jejich konfigurace nebo stavu. |

## Definice typu

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parametry

| Parametr | Typ | Popis |
|------|------|------|
| `uid` | `string` | Jedinečný identifikátor instance cílového modelu, určený při konfiguraci nebo vytvoření (např. `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Volitelné, výchozí hodnota je `false`. Pokud je `true`, vyhledává od aktuálního enginu směrem ke kořenu v „zásobníku zobrazení“, což umožňuje přístup k modelům v enginech vyšší úrovně (např. stránka, která otevřela popup). |

## Návratová hodnota

- Pokud je nalezen, vrátí instanci příslušné podtřídy `FlowModel` (např. `BlockModel`, `FormBlockModel`, `ActionModel`).
- Pokud není nalezen, vrátí `undefined`.

## Rozsah vyhledávání

- **Výchozí (`searchInPreviousEngines: false`)**: Vyhledává pouze v rámci **aktuálního enginu** podle `uid`. V popupech nebo víceúrovňových zobrazeních má každé zobrazení nezávislý engine; ve výchozím nastavení se hledají modely pouze v rámci aktuálního zobrazení.
- **`searchInPreviousEngines: true`**: Vyhledává směrem nahoru podél řetězce `previousEngine` počínaje aktuálním enginem a vrátí první shodu. To je užitečné pro přístup k modelu na stránce, která otevřela aktuální popup.

## Příklady

### Získání jiného bloku a jeho obnovení

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Přístup k modelu na stránce z popupu

```ts
// Přístup k bloku na stránce, která otevřela aktuální popup
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Čtení/zápis napříč modely a spuštění rerenderu

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Bezpečnostní kontrola

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Cílový model neexistuje');
  return;
}
```

## Související

- [ctx.model](./model.md): Model, ve kterém se nachází aktuální kontext spuštění.
- [ctx.blockModel](./block-model.md): Model nadřazeného bloku, ve kterém se nachází aktuální JS; obvykle přístupný bez nutnosti použít `getModel`.