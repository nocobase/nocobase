:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/collection).
:::

# ctx.collection

Instance kolekce (Collection) přidružená k aktuálnímu kontextu vykonávání RunJS. Slouží k přístupu k metadatům kolekce, definicím polí, primárním klíčům a dalším konfiguracím. Obvykle pochází z `ctx.blockModel.collection` nebo `ctx.collectionField?.collection`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSBlock** | Kolekce vázaná na blok; lze přistupovat k `name`, `getFields`, `filterTargetKey` atd. |
| **JSField / JSItem / JSColumn** | Kolekce, do které patří aktuální pole (nebo kolekce nadřazeného bloku), používá se k získání seznamů polí, primárních klíčů atd. |
| **Tabulkový sloupec / Blok detailu** | Používá se pro vykreslování na základě struktury kolekce nebo předávání `filterByTk` při otevírání vyskakovacích oken. |

> Poznámka: `ctx.collection` je k dispozici v případech, kdy je datový blok, formulářový blok nebo tabulkový blok vázán na kolekci. V nezávislém JSBlocku, který není vázán na kolekci, může být `null`. Před použitím doporučujeme provést kontrolu na prázdnou hodnotu.

## Definice typu

```ts
collection: Collection | null | undefined;
```

## Běžné vlastnosti

| Vlastnost | Typ | Popis |
|------|------|------|
| `name` | `string` | Název kolekce (např. `users`, `orders`) |
| `title` | `string` | Titulek kolekce (včetně internacionalizace) |
| `filterTargetKey` | `string \| string[]` | Název pole primárního klíče, používá se pro `filterByTk` a `getFilterByTK` |
| `dataSourceKey` | `string` | Klíč zdroje dat (např. `main`) |
| `dataSource` | `DataSource` | Instance zdroje dat, ke kterému patří |
| `template` | `string` | Šablona kolekce (např. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Seznam polí, která lze zobrazit jako titulky |
| `titleCollectionField` | `CollectionField` | Instance titulkového pole |

## Běžné metody

| Metoda | Popis |
|------|------|
| `getFields(): CollectionField[]` | Získá všechna pole (včetně zděděných) |
| `getField(name: string): CollectionField \| undefined` | Získá jedno pole podle názvu |
| `getFieldByPath(path: string): CollectionField \| undefined` | Získá pole podle cesty (podporuje asociace, např. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Získá asociační pole; `types` může být `['one']`, `['many']` atd. |
| `getFilterByTK(record): any` | Extrahuje hodnotu primárního klíče ze záznamu, používá se pro `filterByTk` v API |

## Vztah k ctx.collectionField a ctx.blockModel

| Požadavek | Doporučené použití |
|------|----------|
| **Kolekce přidružená k aktuálnímu kontextu** | `ctx.collection` (ekvivalent k `ctx.blockModel?.collection` nebo `ctx.collectionField?.collection`) |
| **Definice kolekce aktuálního pole** | `ctx.collectionField?.collection` (kolekce, do které pole patří) |
| **Cílová kolekce asociace** | `ctx.collectionField?.targetCollection` (cílová kolekce asociačního pole) |

V případech jako jsou podtabulky může být `ctx.collection` cílovou kolekcí asociace; v běžných formulářích nebo tabulkách je to obvykle kolekce vázaná na blok.

## Příklady

### Získání primárního klíče a otevření vyskakovacího okna

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Procházení polí pro validaci nebo propojení

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} je povinné pole`);
    return;
  }
}
```

### Získání asociačních polí

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Používá se pro sestavení podtabulek, souvisejících zdrojů atd.
```

## Poznámky

- `filterTargetKey` je název pole primárního klíče kolekce. Některé kolekce mohou používat složené primární klíče `string[]`. Pokud není nakonfigurováno, běžně se jako záloha používá `'id'`.
- V případech jako jsou **podtabulky nebo asociační pole** může `ctx.collection` ukazovat na cílovou kolekci asociace, což se liší od `ctx.blockModel.collection`.
- `getFields()` slučuje pole ze zděděných kolekcí; lokální pole přepisují zděděná pole se stejným názvem.

## Související

- [ctx.collectionField](./collection-field.md): Definice pole kolekce pro aktuální pole
- [ctx.blockModel](./block-model.md): Nadřazený blok obsahující aktuální JS, včetně `collection`
- [ctx.model](./model.md): Aktuální model, který může obsahovat `collection`