:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/data-source).
:::

# ctx.dataSource

Instance `DataSource` vázaná na aktuální kontext spuštění RunJS, která slouží k přístupu ke kolekcím, metadatům polí a správě konfigurací kolekcí **v rámci aktuálního zdroje dat**. Obvykle odpovídá zdroji dat vybranému pro aktuální stránku nebo blok (např. hlavní databáze `main`).

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Operace s jedním zdrojem dat** | Získání metadat kolekcí a polí, když je znám aktuální zdroj dat. |
| **Správa kolekcí** | Získání, přidání, aktualizace nebo odstranění kolekcí v rámci aktuálního zdroje dat. |
| **Získání polí podle cesty** | Použití formátu `nazevKolekce.cestaPole` pro získání definic polí (podporuje cesty asociací). |

> **Poznámka:** `ctx.dataSource` představuje jeden zdroj dat pro aktuální kontext. Chcete-li vypsat nebo přistupovat k jiným zdrojům dat, použijte [ctx.dataSourceManager](./data-source-manager.md).

## Definice typu

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Vlastnosti pouze pro čtení
  get flowEngine(): FlowEngine;   // Aktuální instance FlowEngine
  get displayName(): string;      // Zobrazovaný název (podporuje i18n)
  get key(): string;              // Klíč zdroje dat, např. 'main'
  get name(): string;             // Stejné jako klíč

  // Čtení kolekcí
  getCollections(): Collection[];                      // Získat všechny kolekce
  getCollection(name: string): Collection | undefined; // Získat kolekci podle názvu
  getAssociation(associationName: string): CollectionField | undefined; // Získat asociační pole (např. users.roles)

  // Správa kolekcí
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Metadata polí
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Běžné vlastnosti

| Vlastnost | Typ | Popis |
|------|------|------|
| `key` | `string` | Klíč zdroje dat, např. `'main'` |
| `name` | `string` | Stejné jako klíč |
| `displayName` | `string` | Zobrazovaný název (podporuje i18n) |
| `flowEngine` | `FlowEngine` | Aktuální instance FlowEngine |

## Běžné metody

| Metoda | Popis |
|------|------|
| `getCollections()` | Získá všechny kolekce v aktuálním zdroji dat (seřazené, s odfiltrovanými skrytými kolekcemi). |
| `getCollection(name)` | Získá kolekci podle názvu; `name` může být ve formátu `nazevKolekce.nazevPole` pro získání cílové kolekce asociace. |
| `getAssociation(associationName)` | Získá definici asociačního pole podle `nazevKolekce.nazevPole`. |
| `getCollectionField(fieldPath)` | Získá definici pole podle `nazevKolekce.cestaPole`, podporuje cesty asociací jako `users.profile.avatar`. |

## Vztah k ctx.dataSourceManager

| Požadavek | Doporučené použití |
|------|----------|
| **Jeden zdroj dat vázaný na aktuální kontext** | `ctx.dataSource` |
| **Vstupní bod pro všechny zdroje dat** | `ctx.dataSourceManager` |
| **Získání kolekce v rámci aktuálního zdroje dat** | `ctx.dataSource.getCollection(name)` |
| **Získání kolekce napříč zdroji dat** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Získání pole v rámci aktuálního zdroje dat** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Získání pole napříč zdroji dat** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Příklady

### Získání kolekcí a polí

```ts
// Získání všech kolekcí
const collections = ctx.dataSource.getCollections();

// Získání kolekce podle názvu
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Získání definice pole podle "nazevKolekce.cestaPole" (podporuje asociace)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Získání asociačních polí

```ts
// Získání definice asociačního pole podle nazevKolekce.nazevPole
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Zpracování na základě struktury cílové kolekce
}
```

### Procházení kolekcí pro dynamické zpracování

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Provádění validace nebo dynamické UI na základě metadat pole

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Provádění UI logiky nebo validace na základě interface, enum, validace atd.
}
```

## Poznámky

- Formát cesty pro `getCollectionField(fieldPath)` je `nazevKolekce.cestaPole`, kde první část je název kolekce a následující části jsou cesta k poli (podporuje asociace, např. `user.name`).
- `getCollection(name)` podporuje formát `nazevKolekce.nazevPole`, přičemž vrací cílovou kolekci asociačního pole.
- V kontextu RunJS je `ctx.dataSource` obvykle určen zdrojem dat aktuálního bloku nebo stránky. Pokud ke kontextu není vázán žádný zdroj dat, může být hodnota `undefined`; před použitím doporučujeme provést kontrolu na prázdnou hodnotu.

## Související

- [ctx.dataSourceManager](./data-source-manager.md): Správce zdrojů dat, spravuje všechny zdroje dat.
- [ctx.collection](./collection.md): Kolekce spojená s aktuálním kontextem.
- [ctx.collectionField](./collection-field.md): Definice pole kolekce pro aktuální pole.