:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/data-source).
:::

# ctx.dataSource

Instancja źródła danych (`DataSource`) powiązana z bieżącym kontekstem wykonania RunJS, używana do uzyskiwania dostępu do kolekcji, metadanych pól oraz zarządzania konfiguracjami kolekcji **w obrębie bieżącego źródła danych**. Zazwyczaj odpowiada źródłu danych wybranemu dla bieżącej strony lub bloku (np. główna baza danych `main`).

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Operacje na pojedynczym źródle danych** | Pobieranie metadanych kolekcji i pól, gdy bieżące źródło danych jest znane. |
| **Zarządzanie kolekcjami** | Pobieranie, dodawanie, aktualizowanie lub usuwanie kolekcji w ramach bieżącego źródła danych. |
| **Pobieranie pól według ścieżki** | Użycie formatu `nazwaKolekcji.sciezkaPola` do pobierania definicji pól (obsługuje ścieżki powiązań). |

> Uwaga: `ctx.dataSource` reprezentuje pojedyncze źródło danych dla bieżącego kontekstu. Aby wyliczyć lub uzyskać dostęp do innych źródeł danych, należy użyć [ctx.dataSourceManager](./data-source-manager.md).

## Definicja typu

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Właściwości tylko do odczytu
  get flowEngine(): FlowEngine;   // Bieżąca instancja FlowEngine
  get displayName(): string;      // Nazwa wyświetlana (obsługuje i18n)
  get key(): string;              // Klucz źródła danych, np. 'main'
  get name(): string;             // To samo co key

  // Odczyt kolekcji
  getCollections(): Collection[];                      // Pobiera wszystkie kolekcje
  getCollection(name: string): Collection | undefined; // Pobiera kolekcję po nazwie
  getAssociation(associationName: string): CollectionField | undefined; // Pobiera pole powiązania (np. users.roles)

  // Zarządzanie kolekcjami
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Metadane pól
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Typowe właściwości

| Właściwość | Typ | Opis |
|------|------|------|
| `key` | `string` | Klucz źródła danych, np. `'main'` |
| `name` | `string` | To samo co key |
| `displayName` | `string` | Nazwa wyświetlana (obsługuje i18n) |
| `flowEngine` | `FlowEngine` | Bieżąca instancja FlowEngine |

## Typowe metody

| Metoda | Opis |
|------|------|
| `getCollections()` | Pobiera wszystkie kolekcje w bieżącym źródle danych (posortowane, z odfiltrowanymi ukrytymi). |
| `getCollection(name)` | Pobiera kolekcję po nazwie; `name` może mieć format `nazwaKolekcji.nazwaPola`, aby pobrać docelową kolekcję powiązania. |
| `getAssociation(associationName)` | Pobiera definicję pola powiązania według `nazwaKolekcji.nazwaPola`. |
| `getCollectionField(fieldPath)` | Pobiera definicję pola według `nazwaKolekcji.sciezkaPola`, obsługując ścieżki powiązań, takie jak `users.profile.avatar`. |

## Relacja z ctx.dataSourceManager

| Potrzeba | Zalecane użycie |
|------|----------|
| **Pojedyncze źródło danych powiązane z bieżącym kontekstem** | `ctx.dataSource` |
| **Punkt wejścia dla wszystkich źródeł danych** | `ctx.dataSourceManager` |
| **Pobieranie kolekcji w ramach bieżącego źródła danych** | `ctx.dataSource.getCollection(name)` |
| **Pobieranie kolekcji między źródłami danych** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Pobieranie pola w ramach bieżącego źródła danych** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Pobieranie pola między źródłami danych** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Przykład

### Pobieranie kolekcji i pól

```ts
// Pobierz wszystkie kolekcje
const collections = ctx.dataSource.getCollections();

// Pobierz kolekcję po nazwie
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Pobierz definicję pola według "nazwaKolekcji.sciezkaPola" (obsługuje powiązania)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Pobieranie pól powiązań

```ts
// Pobierz definicję pola powiązania według nazwaKolekcji.nazwaPola
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Przetwarzaj na podstawie struktury docelowej kolekcji
}
```

### Iteracja przez kolekcje w celu dynamicznego przetwarzania

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Wykonywanie walidacji lub dynamicznego interfejsu użytkownika na podstawie metadanych pola

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Wykonaj logikę UI lub walidację na podstawie interfejsu (interface), typu wyliczeniowego (enum), walidacji itp.
}
```

## Uwagi

- Format ścieżki dla `getCollectionField(fieldPath)` to `nazwaKolekcji.sciezkaPola`, gdzie pierwszy segment to nazwa kolekcji, a kolejne segmenty to ścieżka pola (obsługuje powiązania, np. `user.name`).
- `getCollection(name)` obsługuje format `nazwaKolekcji.nazwaPola`, zwracając docelową kolekcję pola powiązania.
- W kontekście RunJS `ctx.dataSource` jest zazwyczaj określany przez źródło danych bieżącego bloku lub strony. Jeśli do kontekstu nie jest przypisane żadne źródło danych, może on mieć wartość `undefined`; przed użyciem zaleca się sprawdzenie, czy wartość nie jest pusta.

## Powiązane

- [ctx.dataSourceManager](./data-source-manager.md): Menedżer źródeł danych, zarządza wszystkimi źródłami danych.
- [ctx.collection](./collection.md): Kolekcja powiązana z bieżącym kontekstem.
- [ctx.collectionField](./collection-field.md): Definicja pola kolekcji dla bieżącego pola.