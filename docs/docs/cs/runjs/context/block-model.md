:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/block-model).
:::

# ctx.blockModel

Model nadřazeného bloku (instance `BlockModel`), ve kterém se nachází aktuální JS pole / JS blok. V případech jako `JSField`, `JSItem` nebo `JSColumn` odkazuje `ctx.blockModel` na blok formuláře nebo tabulky, který obsahuje aktuální JS logiku. V samostatném bloku `JSBlock` může být `null` nebo stejný jako `ctx.model`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSField** | Přístup k `form`, `kolekce` a `resource` nadřazeného bloku formuláře v rámci pole formuláře pro implementaci provázanosti nebo validace. |
| **JSItem** | Přístup k prostředku (resource) a informacím o kolekci nadřazeného bloku tabulky/formuláře v rámci položky podtabulky. |
| **JSColumn** | Přístup k `resource` (např. `getSelectedRows`) a `kolekce` nadřazeného bloku tabulky v rámci sloupce tabulky. |
| **Formulářové akce / Event flow** | Přístup k `form` pro validaci před odesláním, `resource` pro aktualizaci atd. |

> Poznámka: `ctx.blockModel` je k dispozici pouze v kontextech RunJS, kde existuje nadřazený blok. U samostatných `JSBlock` (bez nadřazeného formuláře/tabulky) může být `null`. Před použitím doporučujeme provést kontrolu na prázdnou hodnotu.

## Definice typu

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Konkrétní typ závisí na typu nadřazeného bloku: bloky formuláře jsou většinou `FormBlockModel` nebo `EditFormModel`, zatímco bloky tabulky jsou většinou `TableBlockModel`.

## Běžné vlastnosti

| Vlastnost | Typ | Popis |
|------|------|------|
| `uid` | `string` | Unikátní identifikátor modelu bloku. |
| `collection` | `Collection` | Kolekce svázaná s aktuálním blokem. |
| `resource` | `Resource` | Instance prostředku (resource) používaná blokem (`SingleRecordResource` / `MultiRecordResource` atd.). |
| `form` | `FormInstance` | Blok formuláře: Instance Ant Design Form, podporující `getFieldsValue`, `validateFields`, `setFieldsValue` atd. |
| `emitter` | `EventEmitter` | Emitor událostí, slouží k naslouchání `formValuesChange`, `onFieldReset` atd. |

## Vztah k ctx.model a ctx.form

| Požadavek | Doporučené použití |
|------|----------|
| **Nadřazený blok aktuálního JS** | `ctx.blockModel` |
| **Čtení/zápis polí formuláře** | `ctx.form` (ekvivalent k `ctx.blockModel?.form`, v bloku formuláře je to pohodlnější) |
| **Model aktuálního kontextu spuštění** | `ctx.model` (v `JSField` je to model pole, v `JSBlock` model bloku) |

V `JSField` je `ctx.model` modelem pole a `ctx.blockModel` je blokem formuláře nebo tabulky, který toto pole obsahuje; `ctx.form` je obvykle totéž co `ctx.blockModel.form`.

## Příklady

### Tabulka: Získání vybraných řádků a jejich zpracování

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Nejdříve prosím vyberte data');
  return;
}
```

### Scénář formuláře: Validace a aktualizace

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Naslouchání změnám formuláře

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implementace provázanosti nebo opětovného vykreslení na základě nejnovějších hodnot formuláře
});
```

### Vyvolání opětovného vykreslení bloku

```ts
ctx.blockModel?.rerender?.();
```

## Upozornění

- U **samostatného JSBlock** (bez nadřazeného bloku formuláře nebo tabulky) může být `ctx.blockModel` hodnota `null`. Při přístupu k jeho vlastnostem doporučujeme použít volitelné řetězení (optional chaining): `ctx.blockModel?.resource?.refresh?.()`.
- V **JSField / JSItem / JSColumn** odkazuje `ctx.blockModel` na blok formuláře nebo tabulky, který obsahuje aktuální pole. V **JSBlock** se může jednat o samotný blok nebo nadřazený blok, v závislosti na skutečné hierarchii.
- `resource` existuje pouze u datových bloků; `form` existuje pouze u bloků formuláře. Bloky tabulky obvykle `form` nemají.

## Související

- [ctx.model](./model.md): Model aktuálního kontextu spuštění.
- [ctx.form](./form.md): Instance formuláře, běžně používaná v blocích formuláře.
- [ctx.resource](./resource.md): Instance prostředku (ekvivalent k `ctx.blockModel?.resource`, pokud existuje, použijte přímo).
- [ctx.getModel()](./get-model.md): Získání jiných modelů bloků podle UID.